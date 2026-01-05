// Nichols Photo Lab - Interactive JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const navElements = document.querySelector('.nav-elements');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navOverlay = document.querySelector('.nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link');

    const SWIPE_THRESHOLD = 60;
    let touchStartX = null;
    let touchStartY = null;

    function toggleMobileMenu(forceOpen) {
        if (!navElements || !mobileMenuBtn) {
            return;
        }

        let isOpen = navElements.classList.contains('mobile-open');
        if (typeof forceOpen === 'boolean') {
            isOpen = forceOpen;
        } else {
            isOpen = !isOpen;
        }

        navElements.classList.toggle('mobile-open', isOpen);
        mobileMenuBtn.classList.toggle('is-active', isOpen);
        document.body.classList.toggle('drawer-open', isOpen);
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));

        if (navOverlay) {
            navOverlay.classList.toggle('active', isOpen);
        }
    }

    function handleTouchStart(event) {
        if (!navElements || !navElements.classList.contains('mobile-open')) {
            return;
        }
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }

    function handleTouchMove(event) {
        if (touchStartX === null || touchStartY === null) {
            return;
        }
        const touch = event.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = Math.abs(touch.clientY - touchStartY);

        if (deltaX > SWIPE_THRESHOLD && deltaX > deltaY) {
            toggleMobileMenu(false);
            touchStartX = null;
            touchStartY = null;
        }
    }

    function handleTouchEnd() {
        touchStartX = null;
        touchStartY = null;
    }

    if (mobileMenuBtn && navElements) {
        mobileMenuBtn.addEventListener('click', () => toggleMobileMenu());
    }

    if (navOverlay) {
        navOverlay.addEventListener('click', () => toggleMobileMenu(false));
    }

    if (navElements) {
        navElements.addEventListener('touchstart', handleTouchStart, { passive: true });
        navElements.addEventListener('touchmove', handleTouchMove, { passive: true });
        navElements.addEventListener('touchend', handleTouchEnd);
        navElements.addEventListener('touchcancel', handleTouchEnd);
    }

    document.addEventListener('keyup', event => {
        if (event.key === 'Escape') {
            toggleMobileMenu(false);
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            toggleMobileMenu(false);
        }
    });

    const navElementsContainer = document.querySelector('.nav-elements');

    if (navElementsContainer) {
        navElementsContainer.addEventListener('click', function(e) {
            const target = e.target.closest('a.nav-link, a.order-now-btn');
            if (!target) {
                return;
            }

            if (window.innerWidth <= 768) {
                toggleMobileMenu(false);
            }
            // allow default navigation or scrolling to occur naturally
        });
    }

    toggleMobileMenu(false);

    // Product card hover effects
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        // Add click functionality to product cards
        card.addEventListener('click', function() {
            const cardType = this.classList[1]; // Gets the second class (printing-services, film-processing, reel-video)
           
            switch(cardType) {
                case 'printing-services':
                    window.location.href = 'https://www.roesweb.com/configs/NicholsRW/products/standard';
                    break;
                case 'film-processing':
                    window.location.href = 'film.html';
                    break;
                case 'reel-video':
                    window.location.href = 'video.html';
                    break;
            }
        });
    });

    // Order Now buttons with custom targets
    const routedButtons = document.querySelectorAll('[data-href]');
    routedButtons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            const targetUrl = button.dataset.href;
            if (!targetUrl) {
                return;
            }
            window.location.href = targetUrl;
        });
    });

    // Video formats tab interactions
    const formatTabs = document.querySelectorAll('.format-tab');
    const formatPanels = document.querySelectorAll('.format-panel');

    if (formatTabs.length && formatPanels.length) {
        const tabOrder = Array.from(formatTabs);

        const activateFormat = target => {
            tabOrder.forEach(tab => {
                const isActive = tab.dataset.target === target;
                tab.classList.toggle('is-active', isActive);
                tab.setAttribute('aria-selected', String(isActive));
                tab.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            formatPanels.forEach(panel => {
                const isActive = panel.id === `format-${target}`;
                panel.classList.toggle('is-active', isActive);
                panel.hidden = !isActive;
            });
        };

        tabOrder.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                activateFormat(tab.dataset.target);
            });

            tab.addEventListener('keydown', event => {
                if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
                    return;
                }
                event.preventDefault();
                let nextIndex = index + (event.key === 'ArrowRight' ? 1 : -1);
                if (nextIndex < 0) {
                    nextIndex = tabOrder.length - 1;
                } else if (nextIndex >= tabOrder.length) {
                    nextIndex = 0;
                }
                const nextTab = tabOrder[nextIndex];
                nextTab.focus();
                activateFormat(nextTab.dataset.target);
            });
        });

        const initialTab = tabOrder.find(tab => tab.classList.contains('is-active')) || tabOrder[0];
        if (initialTab) {
            activateFormat(initialTab.dataset.target);
        }
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.nav-bar');

    function handleNavbarScroll() {
        if (!navbar) {
            return;
        }

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        navbar.style.transform = 'translateY(0)';
        if (scrollTop > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavbarScroll);
    handleNavbarScroll();

    // Parallax effect for hero section
    const heroBackground = document.querySelector('.hero-bg-image');
    let lastKnownScrollY = 0;
    let parallaxTicking = false;

    function updateParallax() {
        if (!heroBackground) {
            parallaxTicking = false;
            return;
        }
        const parallaxSpeed = 0.35;
        heroBackground.style.transform = `translate3d(0, ${lastKnownScrollY * parallaxSpeed}px, 0)`;
        parallaxTicking = false;
    }

    window.addEventListener('scroll', function() {
        if (!heroBackground) {
            return;
        }
        lastKnownScrollY = window.pageYOffset || document.documentElement.scrollTop;
        if (!parallaxTicking) {
            window.requestAnimationFrame(updateParallax);
            parallaxTicking = true;
        }
    }, { passive: true });

    updateParallax();

    // Contact icons hover effects
    const contactIcons = document.querySelectorAll('.contact-icon');
    contactIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2)';
            this.style.transition = 'transform 0.3s ease';
        });

        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });

        // Add click functionality to contact icons
        icon.addEventListener('click', function() {
            const iconIndex = Array.from(contactIcons).indexOf(this);
            
            switch(iconIndex) {
                case 0: // Phone icon
                    window.location.href = 'tel:+18014863053';
                    break;
                case 1: // Instagram icon
                    window.open('https://www.instagram.com/nicholsphotolab', '_blank');
                    break;
                case 2: // Mail icon
                    window.location.href = 'mailto:info@nicholsphotolab.com';
                    break;
            }
        });
    });
    // Preload images for better performance
    const imageUrls = [
        'https://www.figma.com/api/mcp/asset/fa2e379d-92c0-48ff-be43-e31b69fa6725',
        'https://www.figma.com/api/mcp/asset/bf648ccc-2850-4530-89b1-abe9af9ddaca',
        'https://www.figma.com/api/mcp/asset/5535bc7a-6cf2-4fcb-8a83-79f849dba4db',
        'https://www.figma.com/api/mcp/asset/0fcdb1bf-4e6d-483a-98d6-f17a32726e5d'
    ];

    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });

    // Contact form submission with Formspree
    const contactForm = document.getElementById('contact-form');
    const formSuccess = document.getElementById('form-success');
    const submitBtn = contactForm ? contactForm.querySelector('.contact-submit-btn') : null;

    if (contactForm) {
        contactForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Disable submit button during submission
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }

            const formData = new FormData(contactForm);

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    // Show success message
                    if (formSuccess) {
                        formSuccess.style.display = 'grid';
                    }

                    // Reset form
                    contactForm.reset();

                    // Hide success message after 8 seconds
                    setTimeout(() => {
                        if (formSuccess) {
                            formSuccess.style.display = 'none';
                        }
                    }, 8000);
                } else {
                    alert('Oops! There was a problem submitting your form. Please try again or call us directly.');
                }
            } catch (error) {
                alert('Oops! There was a problem submitting your form. Please try again or call us directly.');
            } finally {
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send message';
                }
            }
        });
    }

    // Film page tab functionality
    const filmTabs = document.querySelectorAll('.film-tab');
    const filmPanels = document.querySelectorAll('.film-panel');

    if (filmTabs.length && filmPanels.length) {
        filmTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                const section = tab.closest('.film-section');
                
                if (!section) return;
                
                const sectionTabs = section.querySelectorAll('.film-tab');
                const sectionPanels = section.querySelectorAll('.film-panel');

                // Remove active class from tabs in this section only
                sectionTabs.forEach(t => {
                    t.classList.remove('is-active');
                    t.setAttribute('aria-selected', 'false');
                });

                // Add active class to clicked tab
                tab.classList.add('is-active');
                tab.setAttribute('aria-selected', 'true');

                // Hide panels in this section only
                sectionPanels.forEach(panel => {
                    panel.classList.remove('is-active');
                    panel.hidden = true;
                });

                // Show target panel
                const targetPanel = document.getElementById('panel-' + targetTab);
                if (targetPanel) {
                    targetPanel.classList.add('is-active');
                    targetPanel.hidden = false;
                }
            });
        });
    }

    // Auto-scroll functionality for pricing image galleries
    const pricingImageContainers = document.querySelectorAll('.pricing-images');
    
    pricingImageContainers.forEach(container => {
        let scrollInterval;
        let userScrollTimeout;
        let isUserScrolling = false;
        let isResetting = false;
        
        // Auto-scroll speed (pixels per interval)
        const scrollSpeed = 0.9;
        const scrollIntervalTime = 30; // milliseconds
        const userScrollDelay = 2000; // Wait 2 seconds after user stops scrolling
        
        function startAutoScroll() {
            if (scrollInterval) return; // Already scrolling
            
            scrollInterval = setInterval(() => {
                if (!isUserScrolling && !isResetting && container) {
                    // Check if we've reached the bottom
                    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
                        isResetting = true;
                        // Reset to top after a pause
                        setTimeout(() => {
                            if (!isUserScrolling) {
                                container.scrollTop = 0;
                                isResetting = false;
                            }
                        }, 1000);
                    } else {
                        // Continue scrolling down
                        container.scrollTop += scrollSpeed;
                    }
                }
            }, scrollIntervalTime);
        }
        
        function stopAutoScroll() {
            if (scrollInterval) {
                clearInterval(scrollInterval);
                scrollInterval = null;
            }
        }
        
        // Pause on hover
        container.addEventListener('mouseenter', () => {
            isUserScrolling = true;
            stopAutoScroll();
        });
        
        // Resume on mouse leave (immediately)
        container.addEventListener('mouseleave', () => {
            if (userScrollTimeout) {
                clearTimeout(userScrollTimeout);
            }
            
            isUserScrolling = false;
            startAutoScroll();
        });
        
        // Detect wheel/touch scrolling
        container.addEventListener('wheel', () => {
            isUserScrolling = true;
            stopAutoScroll();
            
            if (userScrollTimeout) {
                clearTimeout(userScrollTimeout);
            }
            
            userScrollTimeout = setTimeout(() => {
                isUserScrolling = false;
                startAutoScroll();
            }, userScrollDelay);
        }, { passive: true });
        
        // Wait for images to load and layout to settle before starting auto-scroll
        setTimeout(() => {
            // Ensure we start at the top
            container.scrollTop = 0;
            // Start auto-scroll after a brief delay
            setTimeout(() => {
                startAutoScroll();
            }, 300);
        }, 500);
    });
    
    // Format filtering for film galleries + scan details behavior
    const priceItems = document.querySelectorAll('.price-item[data-format]');
    
    priceItems.forEach(item => {
        item.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            const filmType = this.getAttribute('data-film-type');

            // Develop-only navigation behaviour
            const targetTab = this.getAttribute('data-target-tab');
            const targetSection = this.getAttribute('data-target-section');
            if (targetTab && targetSection) {
                document.querySelector(targetSection).scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
                setTimeout(() => {
                    const targetTabButton = document.querySelector(`.film-tab[data-tab="${targetTab}"]`);
                    if (targetTabButton) {
                        targetTabButton.click();
                    }
                }, 500);
                return;
            }

            // Special handling for scans section: dropdown per button
            if (filmType === 'scans') {
                const scansPanel = document.getElementById('panel-scans');
                if (scansPanel) {
                    const allItems = this.parentElement.querySelectorAll('.price-item');
                    const allScanDetails = scansPanel.querySelectorAll('.scan-detail');
                    const isOpen = this.classList.contains('is-active');

                    // Close all first
                    allItems.forEach(i => i.classList.remove('is-active'));
                    allScanDetails.forEach(detail => detail.classList.remove('is-active'));

                    // If it was not open, open this one
                    if (!isOpen) {
                        this.classList.add('is-active');

                        const detailKey = format;
                        const activeDetail = scansPanel.querySelector(`.scan-detail[data-scan-format="${detailKey}"]`);
                        if (activeDetail) {
                            activeDetail.classList.add('is-active');
                        }
                    }
                }
                return;
            }

            // Original filtering logic for film galleries (C-41, B&W, E-6)
            const panel = document.getElementById(`panel-${filmType}`);
            if (!panel) return;

            const isCurrentlyActive = this.classList.contains('is-active');

            const siblingItems = this.parentElement.querySelectorAll('.price-item');
            siblingItems.forEach(sibling => sibling.classList.remove('is-active'));
            if (!isCurrentlyActive) {
                this.classList.add('is-active');
            }

            const images = panel.querySelectorAll('.film-image-container[data-format]');
            const emptyState = panel.querySelector('.pricing-images-empty');
            const ctaSection = panel.querySelector('.pricing-images-cta');

            if (isCurrentlyActive) {
                images.forEach(image => {
                    image.style.display = '';
                });
                if (emptyState) emptyState.style.display = 'none';
                if (ctaSection) ctaSection.style.display = 'block';
            } else {
                let visibleCount = 0;
                images.forEach(image => {
                    if (image.getAttribute('data-format') === format) {
                        image.style.display = '';
                        visibleCount++;
                    } else {
                        image.style.display = 'none';
                    }
                });

                if (visibleCount === 0) {
                    if (emptyState) emptyState.style.display = 'flex';
                    if (ctaSection) ctaSection.style.display = 'none';
                } else {
                    if (emptyState) emptyState.style.display = 'none';
                    if (ctaSection) ctaSection.style.display = 'block';
                }
            }
        });

        item.style.cursor = 'pointer';
    });

    
    console.log('Nichols Photo Lab website loaded successfully!');
});
