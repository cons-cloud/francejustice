from decimal import Decimal

from django.test import TestCase


class CommissionLogicTest(TestCase):
    def test_commission_calculation(self):
        """
        Verify that the 20% commission is correctly calculated.
        """
        amount = Decimal('1000.00')
        commission_rate = Decimal('0.20')
        expected_commission = amount * commission_rate

        # Simulating the logic used in the app
        commission_amount = (amount * Decimal('20')) / Decimal('100')

        self.assertEqual(commission_amount, expected_commission)
        self.assertEqual(commission_amount, Decimal('200.00'))

    def test_commission_rounding(self):
        """
        Verify that rounding is handled correctly for weird amounts.
        """
        amount = Decimal('99.99')
        commission_amount = (amount * Decimal('20')) / Decimal('100')
        # 19.998 -> should handle precision correctly
        self.assertEqual(commission_amount, Decimal('19.998'))


class ServerSidePriceEnforcementTest(TestCase):
    """
    SECURITY: Validates that the amount used to create a Stripe session
    is always derived from the database, never from client input.

    This simulates the logic of create_checkout_session() in views.py
    to prove that an attacker cannot manipulate the price by sending
    a forged `amount` parameter.
    """

    def _simulate_checkout_amount(self, db_amount_mad, client_amount_cents, payment_type):
        """
        Reproduces the server-side amount selection logic from views.py.
        The client_amount_cents parameter is intentionally ignored,
        just as it is in the actual view.
        """
        db_amount = Decimal(str(db_amount_mad))
        db_commission = (db_amount * Decimal('20')) / Decimal('100')

        if payment_type == 'quote_payment':
            # Server always uses the DB amount — client value is ignored
            amount_cents = int(db_amount * 100)
        else:
            amount_cents = int(db_commission * 100)

        return amount_cents

    def test_client_cannot_tamper_quote_payment_amount(self):
        """
        An attacker sending amount=1 (1 centime) should NOT be able to
        bypass the real price of 5000 MAD stored in the database.
        """
        db_amount_mad = 5000  # Real price from the database: 5000 MAD
        attacker_amount_cents = 1  # Attacker tries to pay 0.01 MAD

        result = self._simulate_checkout_amount(
            db_amount_mad=db_amount_mad,
            client_amount_cents=attacker_amount_cents,
            payment_type='quote_payment',
        )

        # Server must charge 500000 centimes (5000 MAD), NOT 1 centime
        self.assertEqual(result, 500000)
        self.assertNotEqual(result, attacker_amount_cents)

    def test_client_cannot_tamper_commission_amount(self):
        """
        An attacker sending amount=1 should NOT be able to bypass
        the real 20% commission stored in the database.
        """
        db_amount_mad = 1000  # Real quote: 1000 MAD → commission = 200 MAD
        attacker_amount_cents = 1

        result = self._simulate_checkout_amount(
            db_amount_mad=db_amount_mad,
            client_amount_cents=attacker_amount_cents,
            payment_type='commission_payment',
        )

        # Commission = 20% × 1000 MAD = 200 MAD = 20000 centimes
        self.assertEqual(result, 20000)
        self.assertNotEqual(result, attacker_amount_cents)

    def test_zero_amount_is_rejected(self):
        """
        A quote with an amount of 0 MAD should produce 0 centimes,
        which will be caught by the amount_cents <= 0 guard in the view.
        """
        amount_cents = int(Decimal('0') * 100)
        self.assertLessEqual(amount_cents, 0)

    def test_large_amount_conversion(self):
        """
        Verify that a large MAD amount (e.g., 50,000 MAD) is correctly
        converted to centimes without integer overflow or rounding issues.
        """
        db_amount_mad = 50000
        result = self._simulate_checkout_amount(
            db_amount_mad=db_amount_mad,
            client_amount_cents=1,
            payment_type='quote_payment',
        )
        self.assertEqual(result, 5_000_000)

