<template>
  <div v-if="visible">
    <!-- Modal d'inscription (reproduction de inscription.component.html) -->
    <div class="modal fade show" style="display: block;" tabindex="-1" role="dialog" aria-modal="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-item" style="border: none; display: inline-block;">
            <button type="button" class="btn-close p-2 mt-1 float-end rounded-circle"
              style="background-color: #E6E6E6; margin-right: 5px;" aria-label="Close" @click="onClose">
              &times;
            </button>
          </div>

          <div class="modal-body pe-0 ps-0" style="display: inline-block;">
            <div class="col pt-0 pb-1" style="display: inline-block;">
              <div class="col d-flex justify-content-center">
                <img class="img-fluid" src="../assets/Fichier 12.svg" alt="logo_ttm" width="200" height="100">
              </div>
              <div class="text-center" style="display: inline-block;">
                <h3 class="text-dark" style="display: inline-block;">Bienvenue</h3>
                <p class="border-bottom border-1 px-5 text-dark"
                   style="font-family: sans-serif;font-size: 16px;display: inline-block;">
                  Inscrivez-vous et trouvez votre médicament
                </p>
              </div>
            </div>

            <div class="d-flex justify-content-center mt-3">
              <form class="col-md-8 pe-0 ps-0" @submit.prevent="register">
                <div class="mb-3">
                  <label class="form-label mb-1 text-dark" for="firstname"
                         style="font-family: sans-serif;font-size: 16px;font-weight: 600;">Prénom*</label>
                  <input class="form-control" type="text" id="firstname" name="firstname"
                         style="border-radius: 16px" placeholder="Entrez votre prénom" v-model.trim="firstname" required>
                </div>

                <div class="mb-3">
                  <label class="form-label mb-1 text-dark" for="lastname"
                         style="font-family: sans-serif;font-size: 16px;font-weight: 600;">Nom*</label>
                  <input class="form-control" type="text" id="lastname" name="lastname"
                         style="border-radius: 16px" placeholder="Entrez votre nom" v-model.trim="lastname" required>
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label mb-1 text-dark"
                         style="font-size: 16px;font-weight: 600;font-family: sans-serif;">Adresse mail*</label>
                  <input type="email" class="form-control" id="email" name="email" style="border-radius: 16px"
                         placeholder="Entrez votre adresse email" v-model.trim="email" required>
                </div>

                <div class="mb-3">
                  <label for="phone" class="form-label mb-1 text-dark"
                         style="font-family: sans-serif;font-size: 16px;font-weight: 600;">Numéro de téléphone</label>
                  <input type="tel" class="form-control" id="phone" name="phone"
                         style="font-family: sans-serif;border-radius: 16px"
                         placeholder="Entrez votre numéro de téléphone" v-model.trim="phone">
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label mb-1 text-dark"
                         style="font-family: sans-serif;font-size: 16px;font-weight: 600;">Mot de passe*</label>
                  <div class="position-relative">
                    <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password" name="password"
                           style="font-family: sans-serif;border-radius: 16px; padding-right: 40px;"
                           placeholder="Entrez votre mot de passe" v-model="password" required>
                    <button type="button" class="btn-eye" @click="showPassword = !showPassword"
                            :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                      <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <div class="mb-3">
                  <div>
                    <label class="form-label mb-1 text-dark" for="password_confirmation"
                           style="font-family: sans-serif;font-size: 16px;font-weight: 600;">Confirmez votre mot de passe*</label>
                  </div>
                  <div class="position-relative">
                    <input :type="showConfirm ? 'text' : 'password'" id="password_confirmation" name="password_confirmation"
                           style="border-radius: 16px;font-family: sans-serif; padding-right: 40px;" class="form-control"
                           placeholder="Confirmez votre mot de passe" v-model="passwordConfirmation" required>
                    <button type="button" class="btn-eye" @click="showConfirm = !showConfirm"
                            :aria-label="showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'">
                      <i :class="showConfirm ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>

                <!-- Message d'erreur -->
                <div v-if="errorMessage" class="alert alert-danger mt-3" role="alert">{{ errorMessage }}</div>

                <div class="d-flex justify-content-center col modal-item pb-5" style="border: none;">
                  <div class="col text-center" style="display: inline-block;">
                    <button type="submit" class="btn mt-1 col-md-8"
                            style="font-family: sans-serif;border-radius: 16px; background-color: #0F7ABB;color: white;"
                            :disabled="isLoading">
                      {{ isLoading ? "Inscription..." : "S'inscrire" }}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="d-flex justify-content-center col modal-item pb-5" style="border: none;">
            <div class="col text-center" style="display: inline-block;">
              <div style="display: inline-block;">
                <p class="text-dark" style="font-family: sans-serif;">Vous avez déjà un compte ?
                  <a href="#" @click.prevent="onOpenConnexion">Se connecter</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>

    <!-- Toasts -->
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1055;">
      <div v-show="showSuccessToast" class="toast align-items-center text-white bg-success border-0 show" role="alert">
        <div class="d-flex">
          <div class="toast-body">Inscription réussie !</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="showSuccessToast = false"></button>
        </div>
      </div>

      <div v-show="showErrorToast" class="toast align-items-center text-white bg-danger border-0 show" role="alert">
        <div class="d-flex">
          <div class="toast-body">{{ errorMessage || "Inscription échouée. Veuillez réessayer." }}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="showErrorToast = false"></button>
        </div>
      </div>
    </div>
    
    <!-- Modal de félicitations après inscription -->
    <div v-if="showCongrats">
      <div class="modal fade show" style="display:block;" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
          <div class="modal-content p-4 text-dark">
            <div class="modal-body">
              <p class="text-center">
                Félicitation ! <br>
                Pour votre inscription, vous bénéficiez de 10 crédits gratuits pour recherher le produit que
                vous voulez. <br>
                Pour plus de crédits, allez y dans les paramètre de votre compte.
              </p>
            </div>
            <div class="modal-footer" style="justify-content:center;">
              <button class="btn btn-primary" @click="showCongrats = false">Fermer</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AuthService } from '@/Services/AuthService'
import { useCreditStore } from '@/stores/credit'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'openConnexion', 'registerSuccess'])

const firstname = ref('')
const lastname = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)

const isLoading = ref(false)
const errorMessage = ref('')
const showSuccessToast = ref(false)
const showErrorToast = ref(false)
const showCongrats = ref(false)
const creditStore = useCreditStore()

function onClose() {
  emit('close')
}

function onOpenConnexion() {
  emit('openConnexion')
}

async function register() {
  errorMessage.value = ''

  if (!firstname.value || !lastname.value || !email.value || !password.value || !passwordConfirmation.value) {
    errorMessage.value = 'Veuillez remplir tous les champs requis.'
    showErrorToast.value = true
    return
  }
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas.'
    showErrorToast.value = true
    return
  }

  try {
    isLoading.value = true

    // Utilise l'API existante via AuthService.register
    const response = await AuthService.register({
      firstname: firstname.value,
      lastname: lastname.value,
      email: email.value,
      password: password.value,
      phone: phone.value || undefined,
    })

    // Si l'inscription a réussi et qu'un token est retourné, l'utilisateur est déjà connecté
    // Sinon, on tente une connexion automatique
    if (!response.token) {
      console.log('🔄 Token non reçu après inscription, connexion automatique...')
      await AuthService.login({
        username: email.value,
        password: password.value
      })
    }

    showSuccessToast.value = true
    emit('registerSuccess')

    // Essayer d'ajouter 10 crédits gratuits localement (tentative non bloquante)
    try {
      // Rafraîchir le compte si nécessaire puis ajouter les crédits localement
      creditStore.refreshForCurrentUser().catch(() => {})
      // Tentative d'ajout (peut échouer si accountId absent) — fonction gère son propre fallback
      creditStore.addCreditsAfterPayment(10).catch(() => {})
    } catch (e) {
      // ignore
    }

    // Fermer le modal d'inscription et afficher la modale de félicitations
    emit('close')
    showCongrats.value = true
  } catch (e: unknown) {
    console.error('Erreur inscription:', e)
    errorMessage.value = e instanceof Error ? e.message : "Échec de l'inscription"
    showErrorToast.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Forcer les textes en noir et supprimer toute transparence héritée */
.modal-content,
.modal-content .modal-body,
.modal-content .modal-item,
.modal-content .text-center,
.modal-content .col,
.modal-content label,
.modal-content p,
.modal-content h1,
.modal-content h2,
.modal-content h3,
.modal-content h4,
.modal-content h5,
.modal-content h6,
.modal-content a,
.modal-content span {
  color: #000 !important;
  opacity: 1 !important;
}

/* Inputs */
.form-control {
  color: #000 !important;
}

.form-control::placeholder {
  color: #6c757d !important;
  opacity: 1 !important;
}

/* Bouton primaire comme dans l'original */
.btn {
  color: #fff !important;
}

/* Eye toggle button */
.btn-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  padding: 6px;
  color: #6c757d;
}
.btn-eye:focus { outline: none; }
</style>
