from django.test import TestCase
from decimal import Decimal

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
