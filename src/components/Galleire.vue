<template>
  <div class="gallery-wrap" :style="{ height }">
    <!-- Bouton gauche -->
    <button
      class="nav-btn left"
      type="button"
      aria-label="Défiler vers la gauche"
      @click="scroll(-1)"
    >
      ‹
    </button>

    <!-- Piste défilante -->
    <div class="track" ref="trackRef">
      <div
        v-for="(img, i) in images"
        :key="i"
        class="item"
        :style="{ minWidth: itemWidth }"
      >
        <img class="item-img" :src="img" :alt="altText || `Image ${i+1}`" />
        <div v-if="overlayText" class="item-overlay">
          <div class="overlay-text">
            <slot name="text">{{ overlayText }}</slot>
          </div>
        </div>
      </div>
    </div>

    <!-- Bouton droite -->
    <button
      class="nav-btn right"
      type="button"
      aria-label="Défiler vers la droite"
      @click="scroll(1)"
    >
      ›
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import img1 from '@/assets/affiche.png'

type Props = {
  images: string[]
  overlayText?: string
  altText?: string
  height?: string         // ex: '260px' | '40vh'
  itemWidth?: string      // ex: '320px' | '60vw'
  snap?: 'start' | 'center' | 'end'
}

const props = withDefaults(defineProps<Props>(), {
  images: () => [img1],
  overlayText: '',
  altText: 'Image',
  height: '280px',
  itemWidth: '320px',
  snap: 'start'
})

const trackRef = ref<HTMLDivElement | null>(null)

function scroll(direction: 1 | -1) {
  const el = trackRef.value
  if (!el) return
  // fait défiler d'environ la largeur visible (moins un peu)
  const delta = el.clientWidth * 0.9 * direction
  el.scrollBy({ left: delta, behavior: 'smooth' })
}
</script>

<style scoped>
.gallery-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}

/* Piste horizontale défilante */
.track {
  height: 100%;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  padding: 8px 48px; /* espace pour ne pas passer sous les flèches */
}

/* Élément */
.item {
  position: relative;
  height: 100%;
  scroll-snap-align: var(--snap-align, start);
  flex: 0 0 auto; /* important: largeur fixe, pas de wrap */
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
  background: #f7f7f7;
}

/* Image */
.item-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Overlay texte (en haut) */
.item-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: .75rem;
  background: linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.12) 35%, rgba(0,0,0,0) 60%);
  pointer-events: none;
}

.overlay-text {
  color: #fff;
  font-weight: 600;
  font-size: clamp(0.9rem, 2.2vw, 1.2rem);
  text-align: center;
  line-height: 1.35;
  max-width: min(900px, 90vw);
  padding: .25rem .75rem;
  border-radius: .75rem;
  backdrop-filter: blur(2px);
}

/* Boutons navigation */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 40px;
  width: 40px;
  border: none;
  border-radius: 999px;
  background: rgba(0,0,0,.45);
  color: #fff;
  font-size: 22px;
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 2;
  transition: background .2s ease;
}
.nav-btn:hover { background: rgba(0,0,0,.65); }
.nav-btn.left { left: 8px; }
.nav-btn.right { right: 8px; }

/* Scrollbar discrète (optionnel) */
.track::-webkit-scrollbar { height: 8px; }
.track::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,.2);
  border-radius: 999px;
}
</style>
