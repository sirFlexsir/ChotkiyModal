export default class Modal {
	static openSelector = 'data-js-open-modal'
	static closeSelector = 'data-js-close-modal'
	//-------------
	static classNameModalOpen = 'open'
	static classNameModalClose = 'close'
	//-------------
	// Подложка для модалки
	static createShadowElement = null
	static shadowRoot = document.body
	static classNameShadow = 'shadow'
	static classNameShadowOpen = 'open'
	static classNameShadowClose = 'close'
	//-------------
	static activeModal = null
	static firsFocusButton = null

	// Селекторы фокусируемых элементов внутри модалки
	static focusSelectorElements = [
		'a[href]',
		'area[href]',
		'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
		'select:not([disabled]):not([aria-hidden])',
		'textarea:not([disabled]):not([aria-hidden])',
		'button:not([disabled]):not([aria-hidden])',
		'[contenteditable]',
		'[tabindex]:not([tabindex^="-"])',
	]

	constructor(userOptions = {}) {
		// Установка параметров модалки
		this.setOptions(userOptions)

		this.init()
	}

	// *************************************************************************************

	//Иницируем модальные окна
	init = () => {
		if (!this.modalElement) {
			console.warn(`Модальное окно с id ${this.idModal} не найдено`)
			return
		}

		if (!Modal.createShadowElement) {
			Modal.createShadow(Modal.classNameShadow, Modal.shadowRoot)
		}

		this.modalElement.setAttribute('inert', '')

		this.bindEvents()
	}

	bindEvents = () => {
		this.openModalBtnElement.forEach(e => {
			e.addEventListener('click', () => this.openModal(e))
		})

		this.modalElement.addEventListener('click', e => {
			const { target } = e

			if (target.hasAttribute(Modal.closeSelector)) this.closeModal()

			if (target === this.modalElement && this.param.closeModalClick) {
				this.closeModal()
			}
		})

		this.modalElement.addEventListener('keydown', e => {
			if (e.key === 'Escape' && this.param.closeOnEscKey) {
				this.param.closeOnEscKey && this.closeModal()
			}

			if (e.key === 'Tab' && this.param.trapFocus) {
				this.trapFocus(e)
			}
		})
	}

	setOptions = (userOptions = {}) => {
		this.options = {
			elements: {
				modalElement: null,
				focusElements: null,
				openModalBtnElement: null,
			},

			selectors: {
				idModal: userOptions.idModal ?? null,
			},

			param: {
				shadow: userOptions.shadow ?? true,
				closeOnEscKey: userOptions.closeOnEscKey ?? true,
				closeModalClick: userOptions.closeModalClick ?? true,
				trapFocus: userOptions.trapFocus ?? true,
				firstFocus: userOptions.firstFocus ?? true,
			},
		}
		// Находим кнопку открытия данного экземпляра
		this.options.elements.openModalBtnElement = document.querySelectorAll(
			`[${Modal.openSelector} = "${this.options.selectors.idModal}"]`,
		)
		// Находим элемент модалки этого экземпляра
		this.options.elements.modalElement = document.querySelector(
			this.options.selectors.idModal,
		)
	}

	openModal = e => {
		// Проверка если пытаемся открыть модалку которая открыта
		if (Modal.activeModal === this.modalElement) {
			console.warn('Это окно уже открыто')
			return
		}

		// Если есть активная модалка закрываем её
		if (Modal.activeModal) {
			Modal.activeModal.classList.remove(Modal.classNameModalOpen)
			Modal.activeModal.classList.add(Modal.classNameModalClose)
			Modal.activeModal.setAttribute('inert', '')
		}

		// Если до этого небыло открытых модалок то сохраняем кнопку чтобы после закрытия модалок фокус вернулся на нее
		if (!Modal.activeModal) {
			Modal.firsFocusButton = e
		}

		// Открываем выбранную модалку
		this.modalElement.classList.add(Modal.classNameModalOpen)
		this.modalElement.classList.remove(Modal.classNameModalClose)
		this.modalElement.removeAttribute('inert')

		// Нужно чтобы корректно отрабатывал фокус на первом элементе модалки, т.к. фокус не всегда устанавливается
		setTimeout(() => {
			this.startFocusModal()
		}, 100)

		// Обработка параметра для отображения полдложки
		if (this.param.shadow) {
			Modal.createShadowElement.classList.add(Modal.classNameShadowOpen)
			Modal.createShadowElement.classList.remove(Modal.classNameShadowClose)
		} else if (
			Modal.createShadowElement.classList.contains(Modal.classNameShadowOpen)
		) {
			Modal.createShadowElement.classList.remove(Modal.classNameShadowOpen)
			Modal.createShadowElement.classList.add(Modal.classNameShadowClose)
		}
		// Сохраняем активную модалку( в будущем мб можно доработать чтобы на предыдущию модалку возвращался)
		Modal.activeModal = this.modalElement
	}

	closeModal = () => {
		// Закрываем текущею модалку
		this.modalElement.classList.remove(Modal.classNameModalOpen)
		this.modalElement.classList.add(Modal.classNameModalClose)
		this.modalElement.setAttribute('inert', '')
		// убираем подложку
		Modal.createShadowElement.classList.remove(Modal.classNameShadowOpen)
		Modal.createShadowElement.classList.add(Modal.classNameShadowClose)
		Modal.activeModal = null

		// Фозвращаем фокус на кнопку с которой открыли модалку
		if (this.param.firstFocus) {
			Modal.firsFocusButton.focus()
		}
	}

	//********************************************************************************** */

	//* Ловушка для фокуса.(Для правильной работы должен быть внутри фокусируемый элемент, кнопка закрытия например)  Фокус, может не работать на фрэймах внутри модалки, т.к. фокус не проникает внутрь фрэйма. Как костыль можно добавить в начало (например кнопка закрытия) и конце невидимый фокусируемый элемент. Тогда фокус проваливается внутрь. Но закрытие на esc тогда срабатывать не будет

	trapFocus = e => {
		if (this.modalElement.classList.contains(Modal.classNameModalOpen)) {
			const firstFocusable = this.focusElements[0]
			const lastFocusable = this.focusElements[this.focusElements.length - 1]

			if (e.shiftKey && document.activeElement === firstFocusable) {
				e.preventDefault()
				lastFocusable.focus()
			} else if (!e.shiftKey && document.activeElement === lastFocusable) {
				e.preventDefault()
				firstFocusable.focus()
			}
		}
	}

	// Находим фокусируемые элементы и устанавливаем фокус на первй элемент
	startFocusModal = () => {
		this.options.elements.focusElements = this.modalElement.querySelectorAll(
			Modal.focusSelectorElements,
		)

		if (this.options.elements.focusElements.length > 0) {
			this.options.elements.focusElements[0].focus()
		} else {
			// Это если нет фокусируемых элементов, чтобы можно было закрыть модалку на esc
			this.modalElement.setAttribute('tabindex', '0')
			this.modalElement.focus()
		}
	}

	// Создает элемент подложки
	static createShadow = (classShadow, element) => {
		Modal.createShadowElement = document.createElement('div')
		Modal.createShadowElement.classList.add(
			classShadow,
			Modal.classNameShadowClose,
		)
		element.appendChild(Modal.createShadowElement)
	}

	// *************************************************************************************
	// Для быстрого доступа к свойствам класса
	get modalElement() {
		return this.options.elements.modalElement
	}

	get focusElements() {
		return this.options.elements.focusElements
	}

	get openModalBtnElement() {
		return this.options.elements.openModalBtnElement
	}

	get idModal() {
		return this.options.selectors.idModal
	}

	get param() {
		return { ...this.options.param }
	}
}
// *************************************************************************************
// *************************************************************************************
// *************************************************************************************
