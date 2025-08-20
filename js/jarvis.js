// JARVIS Portfolio JavaScript - Main Controller
class JarvisPortfolio {
    constructor() {
        this.isLoaded = false;
        this.currentSection = 'home';
        this.skillsAnimated = false;
        this.statsAnimated = false;
        this.init();
    }

    init() {
        this.showLoadingScreen();
        this.bindEvents();
        this.initializeComponents();
        this.setupIntersectionObserver();
        this.createParticles();
        
        // Hide loading screen after initialization
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 3000);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                this.isLoaded = true;
                this.animateHeroStats();
            }, 1000);
        }
    }

    bindEvents() {
        // Navigation
        this.setupNavigation();
        
        // Smooth scrolling
        this.setupSmoothScrolling();
        
        // Form handling
        this.setupContactForm();
        
        // Filter functionality
        this.setupProjectFilters();
        
        // Typing animation
        this.setupTypingAnimation();
        
        // Window events
        window.addEventListener('scroll', () => this.handleScroll());
        window.addEventListener('resize', () => this.handleResize());
    }

    setupNavigation() {
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.nav-link');

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                menuToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    this.scrollToSection(targetId);
                    
                    // Close mobile menu
                    if (navMenu) {
                        navMenu.classList.remove('active');
                        menuToggle.classList.remove('active');
                    }
                }
            });
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = anchor.getAttribute('href').substring(1);
                this.scrollToSection(targetId);
            });
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const offsetTop = section.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmit(e);
            });
        }
    }

    async handleContactSubmit(e) {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRANSMITTING...';
        submitBtn.disabled = true;
        
        try {
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            this.showNotification('Message transmitted successfully!', 'success');
            e.target.reset();
        } catch (error) {
            this.showNotification('Transmission failed. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    setupProjectFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                
                // Update active filter
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Filter projects
                projectCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        card.style.display = 'block';
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    setupTypingAnimation() {
        const typingElement = document.querySelector('.typing-text');
        if (typingElement) {
            const texts = [
                'AI Engineer',
                'Data Scientist',
                'ML Specialist',
                'Cloud Architect',
                'DevOps Engineer',
                'Full Stack Developer'
            ];
            
            let textIndex = 0;
            let charIndex = 0;
            let isDeleting = false;
            
            const typeText = () => {
                const currentText = texts[textIndex];
                
                if (isDeleting) {
                    typingElement.textContent = currentText.substring(0, charIndex - 1);
                    charIndex--;
                } else {
                    typingElement.textContent = currentText.substring(0, charIndex + 1);
                    charIndex++;
                }
                
                let typeSpeed = isDeleting ? 50 : 100;
                
                if (!isDeleting && charIndex === currentText.length) {
                    typeSpeed = 2000;
                    isDeleting = true;
                } else if (isDeleting && charIndex === 0) {
                    isDeleting = false;
                    textIndex = (textIndex + 1) % texts.length;
                    typeSpeed = 500;
                }
                
                setTimeout(typeText, typeSpeed);
            };
            
            typeText();
        }
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.updateActiveNavLink(sectionId);
                    
                    // Trigger animations
                    if (sectionId === 'skills' && !this.skillsAnimated) {
                        this.animateSkills();
                        this.skillsAnimated = true;
                    }
                }
            });
        }, observerOptions);

        // Observe all sections
        document.querySelectorAll('section[id]').forEach(section => {
            observer.observe(section);
        });
    }

    updateActiveNavLink(sectionId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
        this.currentSection = sectionId;
    }

    animateHeroStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            let current = 0;
            const increment = target / 50;
            
            const updateCount = () => {
                if (current < target) {
                    current += increment;
                    stat.textContent = Math.ceil(current);
                    requestAnimationFrame(updateCount);
                } else {
                    stat.textContent = target;
                }
            };
            
            updateCount();
        });
    }

    animateSkills() {
        const skillBars = document.querySelectorAll('.skill-progress');
        skillBars.forEach((bar, index) => {
            setTimeout(() => {
                const progress = bar.getAttribute('data-progress');
                bar.style.width = progress + '%';
            }, index * 200);
        });
    }

    createParticles() {
        const particlesContainer = document.querySelector('.particles');
        if (!particlesContainer) return;

        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 10 + 5) + 's';
            particle.style.animationDelay = Math.random() * 2 + 's';
            
            particlesContainer.appendChild(particle);
            
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 15000);
        };

        // Create initial particles
        for (let i = 0; i < 20; i++) {
            setTimeout(createParticle, i * 200);
        }

        // Continue creating particles
        setInterval(createParticle, 1000);
    }

    handleScroll() {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }

    handleResize() {
        // Handle responsive adjustments
        const navMenu = document.getElementById('navMenu');
        const menuToggle = document.getElementById('menuToggle');
        
        if (window.innerWidth > 768) {
            if (navMenu) navMenu.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        }
    }

    initializeComponents() {
        // Initialize any additional components
        this.setupMatrixBackground();
        this.setupHolographicEffects();
    }

    setupMatrixBackground() {
        const matrixBg = document.querySelector('.matrix-bg');
        if (!matrixBg) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        matrixBg.appendChild(canvas);

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
        const matrixArray = matrix.split("");

        const fontSize = 10;
        const columns = canvas.width / fontSize;
        const drops = [];

        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00d4ff';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        setInterval(draw, 35);
    }

    setupHolographicEffects() {
        // Add holographic scanning effects
        const holoElements = document.querySelectorAll('.holo-display, .skill-panel, .project-card');
        
        holoElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.boxShadow = '0 0 30px rgba(0, 212, 255, 0.5)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.boxShadow = '';
            });
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `jarvis-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-header">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} notification-icon"></i>
                <span class="notification-title">${type.toUpperCase()}</span>
            </div>
            <div class="notification-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }

    // Public methods for external access
    navigateToSection(sectionId) {
        this.scrollToSection(sectionId);
    }

    filterProjects(category) {
        const filterBtn = document.querySelector(`[data-filter="${category}"]`);
        if (filterBtn) {
            filterBtn.click();
        }
    }

    getSystemStatus() {
        return {
            loaded: this.isLoaded,
            currentSection: this.currentSection,
            timestamp: new Date().toISOString()
        };
    }
}

// Initialize JARVIS Portfolio
document.addEventListener('DOMContentLoaded', () => {
    window.jarvisPortfolio = new JarvisPortfolio();
});

// Export for global access
window.JarvisPortfolio = JarvisPortfolio;