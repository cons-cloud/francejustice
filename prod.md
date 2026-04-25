README — Backend Django pour Law Just
Ce fichier README décrit l'implémentation, la configuration et le déploiement du backend Django conçu pour être connecté à la base Supabase (Postgres + Realtime + Storage + Auth) et pour supporter les dashboards (public, client, avocat/juriste, admin) entièrement synchronisés en temps réel. Il inclut la configuration Stripe pour les paiements et Celery pour les tâches asynchrones.

Table des matières
Présentation
Prérequis
Arborescence du projet
Variables d'environnement (.env)
Installation & démarrage local
Migrations & données initiales
Exécution des workers (Celery)
Stripe — Webhooks & paiements
Supabase — Realtime, Auth & Storage
API — Endpoints clefs
Authentification & Autorisation
Architecture temps réel (workflow)
Sécurité & bonnes pratiques
Tests & CI
Déploiement
Checklist prioritaire
Liens utiles
Présentation
Ce backend est prévu pour :

Servir d'API (Django + DRF) pour l'application React (site public + dashboards).
Ecrire directement sur la base Postgres fournie par Supabase pour que Supabase Realtime diffuse les changements aux clients (sync 100%).
Gérer la logique métier sensible (paiements, génération PDF, IA) côté serveur.
Recevoir et traiter les webhooks Stripe et mettre à jour la DB, déclenchant ainsi des notifications Realtime.
Prérequis
Python 3.11+
Node.js (pour tests frontend locaux si besoin)
Docker & docker-compose (recommandé pour développement cohérent)
Accès à un projet Supabase (DATABASE_URL, ANON_KEY, SERVICE_ROLE_KEY, SUPABASE_URL)
Compte Stripe (clé API, webhook secret)
Redis (pour Celery / Channels)
PostgreSQL géré par Supabase (DATABASE_URL pointe vers celui-ci)
Arborescence recommandée
lua

law_just_backend/
├── app/
│   ├── accounts/
│   ├── profiles/
│   ├── legal/
│   ├── documents/
│   ├── payments/
│   ├── notifications/
│   ├── ai/
│   ├── realtime/
│   └── core/
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── asgi.py
├── scripts/
├── docker/
├── tests/
├── requirements.txt
├── Dockerfile
└── manage.py
Variables d'environnement (.env)
Créez un fichier .env à la racine avec les variables suivantes (exemples) :

ini

# Django
DJANGO_SECRET_KEY=replace_with_secure_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Supabase Postgres)
DATABASE_URL=postgres://user:password@db.host:5432/dbname

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=anon_key_here
SUPABASE_SERVICE_ROLE_KEY=service_role_key_here
SUPABASE_STORAGE_BUCKET=law-just-bucket

# Stripe
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_CLIENT_ID=ca_xxx  # si usage Stripe Connect

# Redis (Channels / Celery)
REDIS_URL=redis://redis:6379/0

# Celery broker / result backend
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Other
DEFAULT_FROM_EMAIL=no-reply@lawjust.example
Installation & démarrage local (sans Docker)
Créez un environnement virtuel :
bash

python -m venv .venv
source .venv/bin/activate
Installez les dépendances :
bash

pip install -r requirements.txt
Chargez les variables d'environnement (.env) et exportez-les, ou utilisez django-environ.

Lancer le serveur Django :

bash

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
Créez un superuser (admin) :
bash

python manage.py createsuperuser
Démarrage avec Docker (recommandé)
Fichier docker-compose.yml exemple inclut services : web, redis, worker.

Construire et démarrer :
bash

docker-compose up --build
Commandes utiles dans le conteneur web :
bash

docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py loaddata initial_data.json
Migrations & données initiales
Générer migrations :
bash

python manage.py makemigrations
python manage.py migrate
Charger fixtures (ex: plans, roles, quelques articles juridiques pour tests) :
bash

python manage.py loaddata fixture_initial_plans.json
Exécution des workers (Celery) & Channels
Lancer Celery worker :
bash

celery -A config.celery_app worker --loglevel=info
Lancer Celery beat (tâches périodiques) :
bash

celery -A config.celery_app beat --loglevel=info
Channels (ASGI) vu via uvicorn / gunicorn + UvicornWorker pour WebSocket support :
bash

gunicorn config.asgi:application -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
Stripe — Setup & Webhook
Installer la clé Stripe dans .env (STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET).
Créer endpoint webhook : /api/payments/stripe-webhook/ (CSRF exempt).
Exemple de traitement d'événements importants :
invoice.payment_succeeded → marquer abonnement actif, lever suspension si existante.
invoice.payment_failed → marquer abonnement en défaut → suspendre compte (is_suspended=True) après règles de grace.
customer.subscription.created → enregistrer stripe_subscription_id.
En local vous pouvez utiliser stripe-cli ou ngrok pour exposer webhooks.
Exemple minimal de handler (views.py):

python

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    # switch on event['type'] ...
    return HttpResponse(status=200)
Supabase — Realtime, Auth & Storage
Base : Django se connecte avec DATABASE_URL de Supabase; toutes les modifications via Django apparaissent dans la même base.
Realtime : configurez Supabase Realtime (WAL replication activée par défaut). Côté frontend, utilisez @supabase/supabase-js pour vous abonner aux tables critiques (profiles, documents, messages, payments, legal_articles).
Auth : deux stratégies :
Recommandée : Supabase Auth côté frontend pour login/auth. Frontend renvoie le JWT à Django sur requêtes protégées ; Django valide token et mappe l'utilisateur local.
Alternative : Django REST auth (DRF Simple JWT) — moins intégré à Supabase Realtime/RLS.
Storage : fichiers (avatars, PDF générés) uploadés via Supabase Storage (côté serveur utiliser SERVICE_ROLE_KEY pour opérations admin).
Exemple d'abonnement supabase-js (frontend):

javascript

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
supabase
  .channel('public:documents')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, payload => {
    console.log('Document change', payload);
  })
  .subscribe();
Endpoints API essentiels (exemples)
Auth & user mapping
POST /api/auth/validate-token/ → valider JWT Supabase et créer/utiliser utilisateur local.
Profiles
GET /api/profiles/me/
PATCH /api/profiles/me/
Documents
POST /api/documents/generate/
GET /api/documents/{id}/
Legal / Search / IA
POST /api/legal/search/
GET /api/legal/articles/
Payments
POST /api/payments/create-checkout/
POST /api/payments/stripe-webhook/
POST /api/payments/subscription/create-lawyer/
Admin
GET /api/admin/users/
PATCH /api/admin/users/{id}/suspend/
POST /api/admin/payments/refund/
Tous les endpoints doivent renvoyer JSON standardisé : { "status": "ok|error", "data": {...}, "errors": [...] }.

Authentification & Autorisations
Middleware custom pour valider JWT Supabase sur chaque requête protégée. Exemple d'architecture :
Frontend : signe via Supabase Auth → récupère JWT.
Frontend : en-tête Authorization: Bearer <jwt> sur requêtes API.
Django : middleware SupabaseJWTAuthentication vérifie signature JWT (JWKS) et récupère sub (user id) puis mappe/created local user.
DRF permissions : IsAuthenticated, IsAdminUser, IsLawyer (custom).
RLS côté Supabase : pour accès direct via supabase-js, configurez policies pour protéger les rows (ex: only owner can read/write). Django utilise SERVICE_ROLE_KEY pour bypass si nécessaire.
Architecture temps réel (workflow recommandé)
Toute action importante passe par Django (validation métier) et écrit dans Postgres (même DB Supabase).
Supabase Realtime détecte le changement via WAL et notifie tous les clients abonnés (site public + dashboards).
Pour retours instantanés côté client (ex: génération PDF ou IA), Django renvoie la réponse HTTP, et écrit un enregistrement task_status dans DB ; le client se met à jour via Realtime.
Pour messages/chat, stocker messages en DB ; clients et dashboards abonnés à la table messages.
Avantages :

Une seule source de vérité (Postgres).
Realtime géré par Supabase, pas besoin d'implémenter un second bus WebSocket.
Django conserve logique, sécurité et intégrité.
Sécurité & bonnes pratiques
Stockez secrets dans variables d'environnement / secrets manager.
Activez SSL/TLS en prod et HSTS.
Nettoyez tout HTML riche via bleach.
Utilisez RLS sur Supabase afin d'empêcher accès indésirable si le frontend communique directement avec Supabase.
Validez et rate-limit endpoints sensibles (auth, webhooks).
Limitez la clé SERVICE_ROLE_KEY aux opérations serveur et ne la leak jamais côté client.
Mise en place de monitoring (Sentry), alerting et logs structurés.
Sauvegardes régulières de la base Supabase (snapshots).
Tests & CI
Utilisez pytest + pytest-django pour tests unitaires et d'intégration.
Tests à inclure :
Webhook Stripe : scenarios success / failed invoices.
Auth mapping Supabase JWT.
Génération PDF (Celery task).
Permissions endpoints (IsLawyer, IsAdmin).
CI pipeline (GitHub Actions) :
Lint (flake8/black/isort)
Tests unitaires
Build docker image
Déploiement staging si tests OK
Exemple job GitHub Actions (squelette):

yaml

name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v4
        with: python-version: '3.11'
      - name: Install deps
        run: pip install -r requirements.txt
      - name: Run tests
        run: pytest -q
Déploiement (production)
Hébergeurs possibles : Render, Fly.io, AWS (ECS/EKS), GCP, DigitalOcean App Platform.
Services requis :
Django app (ASGI) derrière Gunicorn/Uvicorn.
Redis (managed).
Celery workers + Celery beat.
Stripe webhooks exposés via HTTPS (configurer ngrok pour dev).
Domaines & certificats TLS.
Procédé :
Configurer variables d’environnement en prod.
Déployer image Docker.
Lancer migrations en prod.
Provisionner workers et scheduler.
Vérifier webhooks Stripe et Realtime Supabase.
Checklist prioritaire (à valider)
[ ] Choix final de l'auth (Supabase Auth recommandé).
[ ] Provisionner Supabase project et récupérer DATABASE_URL, SERVICE_ROLE_KEY.
[ ] Configurer RLS policies appropriées.
[ ] Implémenter handler Stripe et tester scénarios trial / failed.
[ ] Implémenter mapping JWT Supabase → User local.
[ ] Déployer staging et tester realtime avec supabase-js abonnements.
[ ] Mettre en place Celery et tâches (PDF gen, emails).
[ ] Documenter flows: consultation gratuite, paiement, suspension.
[ ] Tests e2e pour webhooks, realtime events, permissions.
Liens utiles
Supabase Docs: https://supabase.com/docs
Django Docs: https://docs.djangoproject.com/
Django REST Framework: https://www.django-rest-framework.org/
Stripe Docs: https://stripe.com/docs
Celery Docs: https://docs.celeryq.dev/
Channels Docs: https://channels.readthedocs.io/
Exemple commandes utiles
Lancer serveur dev :
bash

python manage.py runserver 0.0.0.0:8000
Lancer migrations :
bash

python manage.py makemigrations && python manage.py migrate
Lancer Celery worker :
bash

celery -A config.celery_app worker --loglevel=info
Lancer tests :
bash

pytest
