document.addEventListener('DOMContentLoaded', () => {
    
    // 1. TYPING EFFECT (Professional)
    const typedTextSpan = document.getElementById('typed-text');
    const textArray = ["BACKEND DEVELOPER", "DATA SCIENTIST", "COMPETITIVE PROGRAMMER", "PROBLEM SOLVER"];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
        if (!typedTextSpan) return;
        const currentText = textArray[textIndex];
        
        if (isDeleting) {
            typedTextSpan.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typedTextSpan.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = 100;
        if (isDeleting) typeSpeed /= 2;

        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % textArray.length;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }
    
    type();

    // 2. COUNTER ANIMATION FOR STATS
    const statValues = document.querySelectorAll('.stat-val[data-count]');
    
    const animateCounter = (element) => {
        const target = parseFloat(element.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        const isDecimal = target % 1 !== 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = isDecimal ? target.toFixed(1) : target;
            }
        };
        
        updateCounter();
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.textContent === '0') {
                animateCounter(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statValues.forEach(el => counterObserver.observe(el));

    // 3. FADE IN ANIMATION
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // 4. MOBILE MENU TOGGLE
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.style.display = (navLinks.style.display === 'flex') ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '70px';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.background = '#050505';
            navLinks.style.padding = '20px';
            navLinks.style.borderBottom = '1px solid #333';
        });
    }

    // 5. ARC REACTOR INTERACTION
    const arcReactor = document.querySelector('.arc-reactor');
    if (arcReactor) {
        arcReactor.addEventListener('click', () => {
            // Create power surge effect
            const powerLevel = document.querySelector('.power-level');
            if (powerLevel) {
                powerLevel.style.animation = 'none';
                setTimeout(() => {
                    powerLevel.style.animation = 'powerSurge 1s ease-out';
                }, 10);
            }
        });
    }

    // 6. PARALLAX EFFECT FOR HUD CORNERS
    document.addEventListener('mousemove', (e) => {
        const hudCorners = document.querySelectorAll('.hud-corner');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        hudCorners.forEach((corner, index) => {
            const speed = (index + 1) * 2;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            corner.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // 7. GLITCH TEXT EFFECT
    const glitchText = document.querySelector('.glitch-text');
    if (glitchText) {
        setInterval(() => {
            glitchText.style.textShadow = `
                ${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px 0 rgba(255, 42, 42, 0.7),
                ${Math.random() * 10 - 5}px ${Math.random() * 10 - 5}px 0 rgba(0, 212, 255, 0.7)
            `;
            setTimeout(() => {
                glitchText.style.textShadow = 'none';
            }, 50);
        }, 3000);
    }
});
