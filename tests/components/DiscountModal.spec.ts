import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises, VueWrapper } from '@vue/test-utils'
import { defineComponent, ref, onMounted } from 'vue'

// Mock of DiscountModal component functionality
const DiscountModalComponent = defineComponent({
  name: 'DiscountModal',
  setup() {
    const showModal = ref(false)
    onMounted(() => {
      const dismissed = window.localStorage.getItem('discountModalDismissed')
      if (!dismissed) {
        showModal.value = true
      }
    })

    const closeModal = () => {
      window.localStorage.setItem('discountModalDismissed', 'true')
      showModal.value = false
    }

    return { showModal, closeModal }
  },
  template: `
    <div v-if="showModal" data-test="discount-modal">
      <button @click="closeModal" aria-label="Close discount modal">X</button>
      <span>Use code BFCM30 at checkout on all products.</span>
    </div>
  `
})

describe('DiscountModal Component', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    window.localStorage.removeItem('discountModalDismissed')
    wrapper = mount(DiscountModalComponent)
  })

  it('renders the modal for new visitors', async () => {
    await flushPromises()
    expect(wrapper.find('[data-test="discount-modal"]').exists()).toBe(true)
  })

  it('does not render the modal if already dismissed', async () => {
    window.localStorage.setItem('discountModalDismissed', 'true')
    wrapper = mount(DiscountModalComponent)
    await flushPromises()
    expect(wrapper.find('[data-test="discount-modal"]').exists()).toBe(false)
  })

  it('closes modal and sets localStorage on close button click', async () => {
    await flushPromises()
    await wrapper.find('button[aria-label="Close discount modal"]').trigger('click')
    expect(wrapper.find('[data-test="discount-modal"]').exists()).toBe(false)
    expect(window.localStorage.getItem('discountModalDismissed')).toBe('true')
  })
})