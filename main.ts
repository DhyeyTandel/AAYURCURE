// AAYURCURE Ayurvedic Clinic - TypeScript Application

// Type Definitions
interface AppointmentFormData {
    patientName: string;
    phoneNumber: string;
    serviceType: string;
    preferredDate: string;
    preferredTime: string;
    message: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

interface ToastOptions {
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

// DOM Helper Functions
class DOMHelper {
    static getElementById<T extends HTMLElement>(id: string): T | null {
        return document.getElementById(id) as T | null;
    }

    static querySelector<T extends HTMLElement>(selector: string): T | null {
        return document.querySelector(selector) as T | null;
    }

    static querySelectorAll<T extends HTMLElement>(selector: string): NodeListOf<T> {
        return document.querySelectorAll(selector) as NodeListOf<T>;
    }

    static addClass(element: HTMLElement, className: string): void {
        element.classList.add(className);
    }

    static removeClass(element: HTMLElement, className: string): void {
        element.classList.remove(className);
    }

    static toggleClass(element: HTMLElement, className: string): void {
        element.classList.toggle(className);
    }

    static hasClass(element: HTMLElement, className: string): boolean {
        return element.classList.contains(className);
    }
}

// Form Validation
class FormValidator {
    private static readonly PHONE_REGEX = /^[6-9]\d{9}$/;

    static validateName(name: string): string {
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            return 'Name is required';
        }
        if (trimmedName.length < 2) {
            return 'Name must be at least 2 characters';
        }
        if (!/^[a-zA-Z\s.]+$/.test(trimmedName)) {
            return 'Name can only contain letters, spaces, and periods';
        }
        return '';
    }

    static validatePhone(phone: string): string {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 0) {
            return 'Phone number is required';
        }
        if (!this.PHONE_REGEX.test(cleanPhone)) {
            return 'Please enter a valid 10-digit Indian mobile number';
        }
        return '';
    }

    static validateDate(dateString: string): string {
        if (!dateString) {
            return ''; // Date is optional
        }

        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return 'Please select a future date';
        }

        // Check if it's Sunday and no time is selected for "by appointment"
        const dayOfWeek = selectedDate.getDay();
        if (dayOfWeek === 0) {
            return 'Sundays are by appointment only - please call to schedule';
        }

        return '';
    }

    static validateForm(formData: AppointmentFormData): ValidationResult {
        const errors: Record<string, string> = {};

        errors.patientName = this.validateName(formData.patientName);
        errors.phoneNumber = this.validatePhone(formData.phoneNumber);
        errors.preferredDate = this.validateDate(formData.preferredDate);

        // Clean up empty error messages
        Object.keys(errors).forEach(key => {
            if (!errors[key]) {
                delete errors[key];
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

// Toast Notification System
class ToastManager {
    private static instance: ToastManager;
    private toastElement: HTMLElement | null = null;
    private messageElement: HTMLElement | null = null;
    private closeButton: HTMLElement | null = null;

    constructor() {
        this.initializeToast();
    }

    static getInstance(): ToastManager {
        if (!ToastManager.instance) {
            ToastManager.instance = new ToastManager();
        }
        return ToastManager.instance;
    }

    private initializeToast(): void {
        this.toastElement = DOMHelper.getElementById('toast');
        this.messageElement = DOMHelper.getElementById('toastMessage');
        this.closeButton = DOMHelper.getElementById('toastClose');

        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }
    }

    show(options: ToastOptions): void {
        if (!this.toastElement || !this.messageElement) return;

        this.messageElement.textContent = options.message;
        
        // Set toast color based on type
        this.toastElement.style.background = options.type === 'error' 
            ? 'var(--color-error)' 
            : 'var(--color-success)';

        DOMHelper.addClass(this.toastElement, 'show');

        // Auto-hide after duration
        const duration = options.duration || 5000;
        setTimeout(() => this.hide(), duration);
    }

    hide(): void {
        if (this.toastElement) {
            DOMHelper.removeClass(this.toastElement, 'show');
        }
    }
}

// Smooth Scroll Router
class Router {
    private navLinks: NodeListOf<HTMLAnchorElement>;

    constructor() {
        this.navLinks = DOMHelper.querySelectorAll<HTMLAnchorElement>('.nav-link');
        this.initializeRouter();
    }

    private initializeRouter(): void {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // Handle hash changes (back/forward navigation)
        window.addEventListener('hashchange', () => this.handleHashChange());
        
        // Handle initial load with hash
        if (window.location.hash) {
            this.handleHashChange();
        }
    }

    private handleNavClick(e: Event): void {
        e.preventDefault();
        const link = e.currentTarget as HTMLAnchorElement;
        const targetId = link.getAttribute('href');
        
        if (targetId && targetId.startsWith('#')) {
            this.navigateToSection(targetId.substring(1));
        }
    }

    private handleHashChange(): void {
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.scrollToSection(hash);
        }
    }

    private navigateToSection(sectionId: string): void {
        // Update URL hash
        history.pushState(null, '', `#${sectionId}`);
        this.scrollToSection(sectionId);
    }

    private scrollToSection(sectionId: string): void {
        const targetElement = DOMHelper.getElementById(sectionId);
        if (targetElement) {
            const headerHeight = 80; // Account for sticky header
            const elementPosition = targetElement.offsetTop - headerHeight;
            
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });

            // Update active nav link
            this.updateActiveNavLink(sectionId);
        }
    }

    private updateActiveNavLink(activeId: string): void {
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeId}`) {
                DOMHelper.addClass(link, 'active');
            } else {
                DOMHelper.removeClass(link, 'active');
            }
        });
    }
}

// Appointment Form Handler
class AppointmentForm {
    private form: HTMLFormElement | null;
    private toastManager: ToastManager;

    constructor() {
        this.form = DOMHelper.getElementById<HTMLFormElement>('appointmentForm');
        this.toastManager = ToastManager.getInstance();
        this.initializeForm();
    }

    private initializeForm(): void {
        if (!this.form) return;

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Set minimum date to today
        const dateInput = DOMHelper.getElementById<HTMLInputElement>('preferredDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.setAttribute('min', today);
        }

        // Add real-time validation
        this.addRealTimeValidation();
    }

    private addRealTimeValidation(): void {
        const nameInput = DOMHelper.getElementById<HTMLInputElement>('patientName');
        const phoneInput = DOMHelper.getElementById<HTMLInputElement>('phoneNumber');
        const dateInput = DOMHelper.getElementById<HTMLInputElement>('preferredDate');

        if (nameInput) {
            nameInput.addEventListener('blur', () => this.validateField('patientName'));
        }

        if (phoneInput) {
            phoneInput.addEventListener('blur', () => this.validateField('phoneNumber'));
            phoneInput.addEventListener('input', (e) => this.formatPhoneInput(e));
        }

        if (dateInput) {
            dateInput.addEventListener('change', () => this.validateField('preferredDate'));
        }
    }

    private formatPhoneInput(e: Event): void {
        const input = e.target as HTMLInputElement;
        let value = input.value.replace(/\D/g, '');
        
        // Limit to 10 digits
        if (value.length > 10) {
            value = value.substring(0, 10);
        }
        
        input.value = value;
    }

    private validateField(fieldName: keyof AppointmentFormData): void {
        const formData = this.getFormData();
        const validation = FormValidator.validateForm(formData);
        
        const errorElement = DOMHelper.getElementById(`${fieldName.replace(/([A-Z])/g, '$1').toLowerCase()}Error`);
        const inputElement = DOMHelper.getElementById<HTMLInputElement>(fieldName);
        
        if (errorElement && inputElement) {
            const error = validation.errors[fieldName] || '';
            errorElement.textContent = error;
            
            if (error) {
                DOMHelper.addClass(inputElement, 'error');
            } else {
                DOMHelper.removeClass(inputElement, 'error');
            }
        }
    }

    private getFormData(): AppointmentFormData {
        if (!this.form) throw new Error('Form not found');

        const formData = new FormData(this.form);
        
        return {
            patientName: (formData.get('patientName') as string) || '',
            phoneNumber: (formData.get('phoneNumber') as string) || '',
            serviceType: (formData.get('serviceType') as string) || '',
            preferredDate: (formData.get('preferredDate') as string) || '',
            preferredTime: (formData.get('preferredTime') as string) || '',
            message: (formData.get('message') as string) || ''
        };
    }

    private clearFormErrors(): void {
        const errorElements = DOMHelper.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });

        const inputElements = DOMHelper.querySelectorAll('.form-input');
        inputElements.forEach(element => {
            DOMHelper.removeClass(element, 'error');
        });
    }

    private displayErrors(errors: Record<string, string>): void {
        Object.entries(errors).forEach(([field, message]) => {
            const errorElement = DOMHelper.getElementById(`${field.replace(/([A-Z])/g, '$1').toLowerCase()}Error`);
            const inputElement = DOMHelper.getElementById<HTMLInputElement>(field);
            
            if (errorElement) {
                errorElement.textContent = message;
            }
            
            if (inputElement) {
                DOMHelper.addClass(inputElement, 'error');
            }
        });
    }

    private generateEmailContent(formData: AppointmentFormData): string {
        const serviceNames: Record<string, string> = {
            'consultation': 'General Consultation',
            'kansya-thali': 'Kansya Thali Massage',
            'panchkarma': 'Pain Management & Panchkarma',
            'hair-skin': 'Hair and Skin Care',
            'viddhkarma': 'Viddhkarma (Needle Therapy)',
            'cupping': 'Cupping Therapy',
            'weight-management': 'Weight Management',
            'swarnaprash': 'Swarnaprash for Kids'
        };

        const timeSlots: Record<string, string> = {
            'morning': 'Morning (9:30 AM - 1:00 PM)',
            'evening': 'Evening (4:30 PM - 7:30 PM)'
        };

        let content = `Appointment Request from AAYURCURE Website\n\n`;
        content += `Patient Name: ${formData.patientName}\n`;
        content += `Phone Number: ${formData.phoneNumber}\n`;
        
        if (formData.serviceType) {
            content += `Service Required: ${serviceNames[formData.serviceType] || formData.serviceType}\n`;
        }
        
        if (formData.preferredDate) {
            const date = new Date(formData.preferredDate);
            content += `Preferred Date: ${date.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}\n`;
        }
        
        if (formData.preferredTime) {
            content += `Preferred Time: ${timeSlots[formData.preferredTime] || formData.preferredTime}\n`;
        }
        
        if (formData.message.trim()) {
            content += `\nAdditional Information:\n${formData.message}\n`;
        }

        content += `\n---\nSubmitted from: AAYURCURE Website`;
        
        return encodeURIComponent(content);
    }

    private generateWhatsAppMessage(formData: AppointmentFormData): string {
        let message = `Hello AAYURCURE, I'd like to book an appointment.\n\n`;
        message += `Name: ${formData.patientName}\n`;
        message += `Phone: ${formData.phoneNumber}\n`;
        
        if (formData.serviceType) {
            message += `Service: ${formData.serviceType}\n`;
        }
        
        if (formData.preferredDate) {
            message += `Date: ${formData.preferredDate}\n`;
        }
        
        if (formData.preferredTime) {
            message += `Time: ${formData.preferredTime}\n`;
        }

        return encodeURIComponent(message);
    }

    private handleSubmit(e: Event): void {
        e.preventDefault();
        
        if (!this.form) return;

        // Clear previous errors
        this.clearFormErrors();

        // Get and validate form data
        const formData = this.getFormData();
        const validation = FormValidator.validateForm(formData);

        if (!validation.isValid) {
            this.displayErrors(validation.errors);
            
            // Focus on first error field
            const firstErrorField = Object.keys(validation.errors)[0];
            const firstErrorElement = DOMHelper.getElementById<HTMLInputElement>(firstErrorField);
            if (firstErrorElement) {
                firstErrorElement.focus();
            }

            this.toastManager.show({
                message: 'Please fix the errors below',
                type: 'error'
            });
            return;
        }

        // Generate email and WhatsApp links
        const emailContent = this.generateEmailContent(formData);
        const whatsappMessage = this.generateWhatsAppMessage(formData);

        // Create mailto link
        const mailtoLink = `mailto:?subject=Appointment Request - AAYURCURE&body=${emailContent}`;
        
        // Create WhatsApp link
        const whatsappLink = `https://wa.me/917359171081?text=${whatsappMessage}`;

        // Show success message
        this.toastManager.show({
            message: 'Appointment request prepared! Choose your preferred contact method.',
            type: 'success'
        });

        // Create action buttons for user to choose
        this.showContactOptions(mailtoLink, whatsappLink);

        // Reset form
        this.form.reset();
    }

    private showContactOptions(emailLink: string, whatsappLink: string): void {
        // Create a temporary modal-like overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1001;
            padding: 1rem;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 4px 16px rgba(45, 80, 22, 0.15);
            text-align: center;
        `;

        modal.innerHTML = `
            <h3 style="color: var(--color-primary-dark); margin-bottom: 1rem;">Choose Contact Method</h3>
            <p style="color: var(--color-text-light); margin-bottom: 1.5rem;">How would you like to send your appointment request?</p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <a href="${whatsappLink}" target="_blank" rel="noopener" style="
                    background: #25D366;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">📱 Send via WhatsApp</a>
                <a href="${emailLink}" style="
                    background: var(--color-primary);
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">📧 Send via Email</a>
                <button id="modalClose" style="
                    background: transparent;
                    border: 2px solid var(--color-accent);
                    color: var(--color-text);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 500;
                ">Close</button>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close modal functionality
        const closeModal = () => document.body.removeChild(overlay);
        
        const closeButton = modal.querySelector('#modalClose');
        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Close on escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
}

// FAQ Accordion
class FAQAccordion {
    private faqQuestions: NodeListOf<HTMLButtonElement>;

    constructor() {
        this.faqQuestions = DOMHelper.querySelectorAll<HTMLButtonElement>('.faq-question');
        this.initializeAccordion();
    }

    private initializeAccordion(): void {
        this.faqQuestions.forEach(question => {
            question.addEventListener('click', (e) => this.toggleFAQ(e));
        });
    }

    private toggleFAQ(e: Event): void {
        const button = e.currentTarget as HTMLButtonElement;
        const faqItem = button.parentElement;
        const answer = faqItem?.querySelector('.faq-answer') as HTMLElement;
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        if (!answer) return;

        // Close all other FAQs
        this.faqQuestions.forEach(otherButton => {
            if (otherButton !== button) {
                otherButton.setAttribute('aria-expanded', 'false');
                const otherAnswer = otherButton.parentElement?.querySelector('.faq-answer') as HTMLElement;
                if (otherAnswer) {
                    otherAnswer.style.maxHeight = '0';
                }
            }
        });

        // Toggle current FAQ
        if (isExpanded) {
            button.setAttribute('aria-expanded', 'false');
            answer.style.maxHeight = '0';
        } else {
            button.setAttribute('aria-expanded', 'true');
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    }
}

// Mobile Navigation
class MobileNavigation {
    private navToggle: HTMLButtonElement | null;
    private navMenu: HTMLElement | null;

    constructor() {
        this.navToggle = DOMHelper.getElementById<HTMLButtonElement>('navToggle');
        this.navMenu = DOMHelper.getElementById('navMenu');
        this.initializeMobileNav();
    }

    private initializeMobileNav(): void {
        if (!this.navToggle || !this.navMenu) return;

        this.navToggle.addEventListener('click', () => this.toggleMenu());

        // Close menu when clicking nav links
        const navLinks = this.navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.navMenu?.contains(e.target as Node) && 
                !this.navToggle?.contains(e.target as Node)) {
                this.closeMenu();
            }
        });
    }

    private toggleMenu(): void {
        if (!this.navToggle || !this.navMenu) return;

        DOMHelper.toggleClass(this.navMenu, 'active');
        DOMHelper.toggleClass(this.navToggle, 'active');
    }

    private closeMenu(): void {
        if (!this.navToggle || !this.navMenu) return;

        DOMHelper.removeClass(this.navMenu, 'active');
        DOMHelper.removeClass(this.navToggle, 'active');
    }
}

// Mobile CTA Visibility Controller
class MobileCTAController {
    private mobileCTA: HTMLElement | null;
    private lastScrollY: number = 0;

    constructor() {
        this.mobileCTA = DOMHelper.getElementById('mobileCta');
        this.initializeCTAController();
    }

    private initializeCTAController(): void {
        if (!this.mobileCTA) return;

        window.addEventListener('scroll', () => this.handleScroll());
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize(); // Initial check
    }

    private handleScroll(): void {
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > this.lastScrollY;
        const isAtBottom = (window.innerHeight + currentScrollY) >= document.body.offsetHeight - 100;

        if (window.innerWidth <= 768) {
            if (isScrollingDown && !isAtBottom) {
                this.hideCTA();
            } else {
                this.showCTA();
            }
        }

        this.lastScrollY = currentScrollY;
    }

    private handleResize(): void {
        if (!this.mobileCTA) return;

        if (window.innerWidth > 768) {
            this.mobileCTA.style.display = 'none';
        } else {
            this.mobileCTA.style.display = 'grid';
        }
    }

    private showCTA(): void {
        if (this.mobileCTA && window.innerWidth <= 768) {
            this.mobileCTA.style.transform = 'translateY(0)';
        }
    }

    private hideCTA(): void {
        if (this.mobileCTA && window.innerWidth <= 768) {
            this.mobileCTA.style.transform = 'translateY(100%)';
        }
    }
}

// Intersection Observer for Animations
class AnimationController {
    private observer: IntersectionObserver;

    constructor() {
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            }
        );
        this.initializeAnimations();
    }

    private initializeAnimations(): void {
        const animatedElements = DOMHelper.querySelectorAll('.service-card, .timing-card, .contact-item');
        animatedElements.forEach(element => {
            this.observer.observe(element);
        });
    }

    private handleIntersection(entries: IntersectionObserverEntry[]): void {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target as HTMLElement;
                element.style.animation = 'fadeInUp 0.6s ease-out forwards';
                this.observer.unobserve(element);
            }
        });
    }
}

// Performance Monitor
class PerformanceMonitor {
    static logPageLoad(): void {
        window.addEventListener('load', () => {
            if ('performance' in window) {
                const loadTime = performance.now();
                console.log(`Page loaded in ${Math.round(loadTime)}ms`);
            }
        });
    }

    static preloadCriticalResources(): void {
        // Preload phone number for quick dialing
        const phoneLink = document.createElement('link');
        phoneLink.rel = 'prefetch';
        phoneLink.href = 'tel:+917359171081';
        document.head.appendChild(phoneLink);

        // Preload WhatsApp link
        const whatsappLink = document.createElement('link');
        whatsappLink.rel = 'prefetch';
        whatsappLink.href = 'https://wa.me/917359171081';
        document.head.appendChild(whatsappLink);
    }
}

// Accessibility Enhancements
class AccessibilityController {
    static initializeKeyboardNavigation(): void {
        // Enhanced keyboard navigation for custom elements
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target as HTMLElement;
                if (target.classList.contains('faq-question')) {
                    e.preventDefault();
                    target.click();
                }
            }
        });
    }

    static announcePageChanges(): void {
        // Announce section changes for screen readers
        const sections = DOMHelper.querySelectorAll('section[id]');
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const sectionTitle = entry.target.querySelector('h2, h1');
                        if (sectionTitle) {
                            // Create temporary announcement element
                            const announcement = document.createElement('div');
                            announcement.setAttribute('aria-live', 'polite');
                            announcement.setAttribute('aria-atomic', 'true');
                            announcement.style.position = 'absolute';
                            announcement.style.left = '-10000px';
                            announcement.textContent = `Viewing ${sectionTitle.textContent} section`;
                            document.body.appendChild(announcement);
                            
                            setTimeout(() => document.body.removeChild(announcement), 1000);
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        sections.forEach(section => observer.observe(section));
    }
}

// Main Application Class
class AayurcureApp {
    private router: Router;
    private appointmentForm: AppointmentForm;
    private faqAccordion: FAQAccordion;
    private mobileNavigation: MobileNavigation;
    private mobileCTAController: MobileCTAController;
    private animationController: AnimationController;

    constructor() {
        this.initializeApp();
    }

    private initializeApp(): void {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    private setup(): void {
        // Initialize all components
        this.router = new Router();
        this.appointmentForm = new AppointmentForm();
        this.faqAccordion = new FAQAccordion();
        this.mobileNavigation = new MobileNavigation();
        this.mobileCTAController = new MobileCTAController();
        this.animationController = new AnimationController();

        // Initialize performance monitoring
        PerformanceMonitor.logPageLoad();
        PerformanceMonitor.preloadCriticalResources();

        // Initialize accessibility features
        AccessibilityController.initializeKeyboardNavigation();
        AccessibilityController.announcePageChanges();

        // Add smooth scroll behavior for all internal links
        this.initializeSmoothScroll();

        console.log('AAYURCURE website initialized successfully');
    }

    private initializeSmoothScroll(): void {
        const internalLinks = DOMHelper.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
        internalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#') && href.length > 1) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = DOMHelper.getElementById(targetId);
                    
                    if (targetElement) {
                        const headerHeight = 80;
                        const elementPosition = targetElement.offsetTop - headerHeight;
                        
                        window.scrollTo({
                            top: elementPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }
}

// Initialize Application
new AayurcureApp();