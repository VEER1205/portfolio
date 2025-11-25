// Typed.js Implementation
class TypeWriter {
    constructor(element, words, speed = 100) {
        this.element = element;
        this.words = words;
        this.speed = speed;
        this.currentWord = 0;
        this.currentChar = 0;
        this.isDeleting = false;
        this.type();
    }

    type() {
        const current = this.words[this.currentWord];
        
        if (this.isDeleting) {
            this.element.textContent = current.substring(0, this.currentChar - 1);
            this.currentChar--;
        } else {
            this.element.textContent = current.substring(0, this.currentChar + 1);
            this.currentChar++;
        }

        let typeSpeed = this.speed;
        if (this.isDeleting) typeSpeed /= 2;

        if (!this.isDeleting && this.currentChar === current.length) {
            typeSpeed = 2000;
            this.isDeleting = true;
        } else if (this.isDeleting && this.currentChar === 0) {
            this.isDeleting = false;
            this.currentWord = (this.currentWord + 1) % this.words.length;
            typeSpeed = 500;
        }

        setTimeout(() => this.type(), typeSpeed);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Typing Effect
    const typedElement = document.getElementById('typed-text');
    if(typedElement) {
        new TypeWriter(typedElement, [
            'BACKEND DEVELOPER',
            'DATA SCIENTIST',
            'COMPETITIVE PROGRAMMER'
        ], 100);
    }

    // 2. Intersection Observer for Fade-in Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // 3. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if(menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Animate hamburger to X
            const bars = menuToggle.querySelectorAll('span');
            menuToggle.classList.toggle('open');
            if(menuToggle.classList.contains('open')) {
                bars[0].style.transform = "rotate(45deg) translate(5px, 5px)";
                bars[1].style.opacity = "0";
                bars[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
            } else {
                bars[0].style.transform = "none";
                bars[1].style.opacity = "1";
                bars[2].style.transform = "none";
            }
        });
    }

    // 4. Navbar Background on Scroll
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(0, 0, 0, 0.98)';
            navbar.style.padding = '1rem 2rem';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.padding = '1.2rem 2rem';
        }
    });
});
