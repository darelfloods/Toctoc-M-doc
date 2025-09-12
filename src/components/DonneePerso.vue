<template>
  <!-- Modal sur l'utilisation des données personnelles -->
  <div
    class="modal fade modal-custom"
    id="donnee"
    data-bs-backdrop="static"
    data-bs-keyboard="false"
    tabindex="-1"
    aria-labelledby="privacyModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-custom modal-dialog-scrollable">
      <div class="modal-content modal-content-custom">
        <!-- En-tête du modal -->
        <div class="modal-header-custom">
          <button type="button" class="btn-close-custom" data-bs-dismiss="modal" aria-label="Fermer">
            <i class="fas fa-times"></i>
          </button>
          <div class="logo-container">
            <i class="fas fa-user-shield logo-icon">
              <!-- Adjusted asset path for Vue public folder -->
              <img src="/assets/Fichier 12.svg" width="70" alt="" />
            </i>
          </div>
          <h1 class="modal-title-custom" id="privacyModalLabel">Utilisation des données personnelles</h1>
        </div>

        <!-- Corps du modal -->
        <div class="modal-body modal-body-custom">
          <!-- Message de bienvenue -->
          <div class="welcome-text">
            <h5 class="mb-3"><i class="fas fa-hand-paper me-2"></i>Bienvenue sur TOCTOCMEDOC !</h5>
            <p class="mb-0">
              Nous attachons une grande importance à la protection de vos données personnelles et nous voulons nous assurer que
              vous comprenez comment nous utilisons et protégeons ces informations. Veuillez lire attentivement les informations
              ci-dessous.
            </p>
          </div>

          <!-- Section 1: Collecte des données -->
          <div class="section-card">
            <h6 class="section-title">
              <span class="section-icon"><i class="fas fa-database"></i></span>
              1. Collecte des Données Personnelles
            </h6>
            <div class="section-content">
              <p>En utilisant TOCTOCMEDOC, vous consentez à la collecte des informations suivantes :</p>
              <ul>
                <li>Informations d'identification (nom, prénom, adresse e-mail, etc.)</li>
                <li>Informations de compte et de connexion</li>
                <li>Informations de paiement (le cas échéant)</li>
              </ul>
            </div>
          </div>

          <!-- Section 2: Utilisation des données -->
          <div class="section-card">
            <h6 class="section-title">
              <span class="section-icon"><i class="fas fa-cogs"></i></span>
              2. Utilisation des Données Personnelles
            </h6>
            <div class="section-content">
              <p>Nous utilisons vos données personnelles dans les buts suivants :</p>
              <ul>
                <li>Fourniture des services demandés</li>
                <li>Personnalisation de l'expérience utilisateur</li>
                <li>Traitement des transactions et paiements</li>
                <li>Communication relative au service (notifications, mises à jour, etc.)</li>
              </ul>
            </div>
          </div>

          <!-- Section 3: Partage des données -->
          <div class="section-card">
            <h6 class="section-title">
              <span class="section-icon"><i class="fas fa-share-alt"></i></span>
              3. Partage des Données Personnelles
            </h6>
            <div class="section-content">
              <p>Nous ne partageons pas vos données personnelles avec des tiers sauf dans les cas suivants :</p>
              <ul>
                <li>Lorsque cela est nécessaire pour fournir les services demandés</li>
                <li>Conformément aux lois et réglementations applicables</li>
              </ul>
            </div>
          </div>

          <!-- Section 4: Sécurité -->
          <div class="section-card">
            <h6 class="section-title">
              <span class="section-icon"><i class="fas fa-shield-alt"></i></span>
              4. Sécurité des Données
            </h6>
            <div class="section-content">
              <p>
                Nous mettons en place des mesures de sécurité appropriées pour protéger vos données personnelles contre tout accès
                non autorisé ou utilisation abusive.
              </p>
            </div>
          </div>

          <!-- Section 5: Conservation -->
          <div class="section-card">
            <h6 class="section-title">
              <span class="section-icon"><i class="fas fa-clock"></i></span>
              5. Durée de Conservation des Données
            </h6>
            <div class="section-content">
              <p>
                Vos données personnelles seront conservées pendant la durée nécessaire pour atteindre les objectifs mentionnés
                ci-dessus, sauf si une période de conservation plus longue est requise ou autorisée par la loi.
              </p>
            </div>
          </div>

          <!-- Section 6: Responsabilité -->
          <div class="section-card">
            <h6 class="section-title">
              <span class="section-icon"><i class="fas fa-exclamation-triangle"></i></span>
              6. Responsabilité
            </h6>
            <div class="section-content">
              <p>
                L'entreprise ne peut être tenue responsable des préjudices résultant de l'utilisation de l'Application. Les
                utilisateurs comprennent et acceptent que l'utilisation de l'Application est à leurs propres risques.
              </p>
            </div>
          </div>

          <!-- Section 7: Consentement -->
          <div class="section-card">
            <h6 class="section-title">
              <span class="section-icon"><i class="fas fa-handshake"></i></span>
              7. Votre Consentement
            </h6>
            <div class="section-content">
              <p>
                En utilisant nos services, vous consentez à la collecte, au traitement, à l'utilisation et au partage de vos
                données personnelles conformément aux conditions énoncées ci-dessus.
              </p>
              <div class="contact-info mt-3">
                <i class="fas fa-globe me-2"></i>
                Si vous avez des questions ou des préoccupations concernant notre utilisation de vos données personnelles,
                n'hésitez pas à nous contacter à l'adresse :
                <strong>contactepharma.ga</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Pied du modal -->
        <div class="modal-footer-custom">
          <p class="thank-you-text">
            <i class="fas fa-heart me-2"></i>
            Merci pour votre confiance !
          </p>
          <button type="button" class="btn btn-primary-custom" style="border-radius: 30px;" data-bs-dismiss="modal">
            <i class="fas fa-check me-2"></i>
            J'ai compris
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Ce composant est purement présentational. Assurez-vous que Bootstrap JS et Font Awesome
// sont chargés globalement si vous souhaitez le comportement modal et les icônes.
</script>

<style>
:root {
  --primary-color: #0F7ABB;
  --secondary-color: #E6F3FF;
  --text-color: #333;
  --border-radius: 15px;
}

.modal-custom {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.modal-dialog-custom {
  max-width: 900px;
  margin: 2rem auto;
}

.modal-content-custom {
  border: none;
  border-radius: var(--border-radius);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header-custom {
  background: linear-gradient(135deg, var(--primary-color), #1a8dd8);
  color: white;
  padding: 2rem;
  text-align: center;
  position: relative;
}

.modal-header-custom::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.3;
}

.modal-header-custom > * {
  position: relative;
  z-index: 1;
}

.btn-close-custom {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  z-index: 2;
}

.btn-close-custom:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.logo-container {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.logo-icon {
  font-size: 2rem;
  color: var(--primary-color);
}

.modal-title-custom {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.modal-body-custom {
  padding: 2rem;
  max-height: 60vh;
  overflow-y: auto;
}

.welcome-text {
  background: var(--secondary-color);
  padding: 1.5rem;
  border-radius: var(--border-radius);
  margin-bottom: 2rem;
  border-left: 4px solid var(--primary-color);
}

.section-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.section-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--primary-color);
  transform: scaleY(0);
  transition: transform 0.3s ease;
  transform-origin: bottom;
}

.section-card:hover::before {
  transform: scaleY(1);
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(15, 122, 187, 0.1);
}

.section-title {
  color: var(--primary-color);
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-content {
  color: var(--text-color);
  line-height: 1.6;
}

.section-content ul {
  list-style: none;
  padding-left: 0;
}

.section-content li {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.section-content li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--primary-color);
  font-weight: bold;
}

.modal-footer-custom {
  background: #f8f9fa;
  padding: 2rem;
  text-align: center;
  border-top: 1px solid #e9ecef;
}

.thank-you-text {
  color: var(--primary-color);
  font-weight: 700;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.btn-primary-custom {
  background: linear-gradient(135deg, var(--primary-color), #1a8dd8);
  border: none;
  border-radius: var(--border-radius);
  padding: 0.75rem 2rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.btn-primary-custom::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-primary-custom:hover::before {
  left: 100%;
}

.btn-primary-custom:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(15, 122, 187, 0.3);
}

.contact-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  font-style: italic;
  color: #6c757d;
  border-left: 3px solid var(--primary-color);
}

/* Animation d'entrée */
.modal.fade .modal-dialog {
  transform: scale(0.8) translateY(-50px);
  opacity: 0;
}

.modal.show .modal-dialog {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* Scrollbar personnalisée */
.modal-body-custom::-webkit-scrollbar {
  width: 6px;
}

.modal-body-custom::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-body-custom::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

.modal-body-custom::-webkit-scrollbar-thumb:hover {
  background: #0d6aa3;
}

@media (max-width: 768px) {
  .modal-dialog-custom {
    margin: 1rem;
    max-width: calc(100% - 2rem);
  }

  .modal-header-custom {
    padding: 1.5rem;
  }

  .modal-body-custom {
    padding: 1.5rem;
  }

  .modal-title-custom {
    font-size: 1.5rem;
  }
}
</style>
