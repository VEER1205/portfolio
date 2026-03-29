// Staggered Menu Component - Vanilla JS + GSAP port

class StaggeredMenu {
  constructor(options = {}) {
    this.position = options.position || 'right';
    this.menuButtonColor = options.menuButtonColor || '#fff';
    this.openMenuButtonColor = options.openMenuButtonColor || '#fff';
    this.changeMenuColorOnOpen = options.changeMenuColorOnOpen ?? true;
    
    this.isOpen = false;
    this.isBusy = false;
    this.textLines = ['Menu', 'Close'];

    // DOM Elements
    this.wrapper = document.querySelector('.staggered-menu-wrapper');
    this.panel = document.querySelector('.staggered-menu-panel');
    this.preLayers = Array.from(document.querySelectorAll('.sm-prelayer'));
    this.toggleBtn = document.querySelector('.sm-toggle');
    this.icon = document.querySelector('.sm-icon');
    this.plusH = document.querySelector('.sm-icon-line:not(.sm-icon-line-v)');
    this.plusV = document.querySelector('.sm-icon-line-v');
    this.textInner = document.querySelector('.sm-toggle-textInner');
    
    // Arrays of items within panel
    this.itemEls = Array.from(this.panel.querySelectorAll('.sm-panel-itemLabel'));
    this.numberEls = Array.from(this.panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
    this.socialTitle = this.panel.querySelector('.sm-socials-title');
    this.socialLinks = Array.from(this.panel.querySelectorAll('.sm-socials-link'));

    // Timelines & Tweens
    this.openTl = null;
    this.closeTween = null;
    this.spinTween = null;
    this.textAnimTween = null;
    this.colorTween = null;

    this.init();
  }

  init() {
    if (!this.panel || !this.toggleBtn) return;

    // Initial CSS setup
    const offscreen = this.position === 'left' ? -100 : 100;
    gsap.set([this.panel, ...this.preLayers], { xPercent: offscreen });
    gsap.set(this.plusH, { transformOrigin: '50% 50%', rotate: 0 });
    gsap.set(this.plusV, { transformOrigin: '50% 50%', rotate: 90 });
    gsap.set(this.icon, { rotate: 0, transformOrigin: '50% 50%' });
    gsap.set(this.textInner, { yPercent: 0 });
    gsap.set(this.toggleBtn, { color: this.menuButtonColor });

    // Event Listeners
    this.toggleBtn.addEventListener('click', () => this.toggleMenu());
    
    // Close on click away
    document.addEventListener('mousedown', (e) => {
      if (
        this.isOpen &&
        !this.panel.contains(e.target) &&
        !this.toggleBtn.contains(e.target)
      ) {
        this.closeMenu();
      }
    });

    // Handle clicks on menu items to close
    this.panel.querySelectorAll('.sm-panel-item').forEach(el => {
      el.addEventListener('click', () => {
        // give it a tiny delay so they can see the click effect
        setTimeout(() => this.closeMenu(), 150);
      });
    });
  }

  buildOpenTimeline() {
    this.openTl?.kill();
    this.closeTween?.kill();
    this.closeTween = null;

    if (this.itemEls.length) gsap.set(this.itemEls, { yPercent: 140, rotate: 10 });
    if (this.numberEls.length) gsap.set(this.numberEls, { '--sm-num-opacity': 0 });
    if (this.socialTitle) gsap.set(this.socialTitle, { opacity: 0 });
    if (this.socialLinks.length) gsap.set(this.socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    this.preLayers.forEach((el, i) => {
      const startX = Number(gsap.getProperty(el, 'xPercent'));
      tl.fromTo(el, { xPercent: startX }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });

    const lastTime = this.preLayers.length ? (this.preLayers.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (this.preLayers.length ? 0.08 : 0);
    const panelDuration = 0.65;
    
    const panelStart = Number(gsap.getProperty(this.panel, 'xPercent'));
    tl.fromTo(
      this.panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (this.itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;
      tl.to(
        this.itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' }
        },
        itemsStart
      );
      if (this.numberEls.length) {
        tl.to(
          this.numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    if (this.socialTitle || this.socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (this.socialTitle) {
        tl.to(
          this.socialTitle,
          { opacity: 1, duration: 0.5, ease: 'power2.out' },
          socialsStart
        );
      }
      if (this.socialLinks.length) {
        tl.to(
          this.socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(this.socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    this.openTl = tl;
    return tl;
  }

  playOpen() {
    if (this.isBusy) return;
    this.isBusy = true;
    this.wrapper.setAttribute('data-open', 'true');
    this.panel.setAttribute('aria-hidden', 'false');
    this.toggleBtn.setAttribute('aria-expanded', 'true');

    const tl = this.buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => { this.isBusy = false; });
      tl.play(0);
    } else {
      this.isBusy = false;
    }
  }

  playClose() {
    this.openTl?.kill();
    this.openTl = null;

    this.closeTween?.kill();
    const offscreen = this.position === 'left' ? -100 : 100;
    const allLayers = [...this.preLayers, this.panel];

    this.closeTween = gsap.to(allLayers, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        if (this.itemEls.length) gsap.set(this.itemEls, { yPercent: 140, rotate: 10 });
        if (this.numberEls.length) gsap.set(this.numberEls, { '--sm-num-opacity': 0 });
        if (this.socialTitle) gsap.set(this.socialTitle, { opacity: 0 });
        if (this.socialLinks.length) gsap.set(this.socialLinks, { y: 25, opacity: 0 });
        
        this.wrapper.removeAttribute('data-open');
        this.panel.setAttribute('aria-hidden', 'true');
        this.toggleBtn.setAttribute('aria-expanded', 'false');
        
        this.isBusy = false;
      }
    });
  }

  animateIcon(opening) {
    this.spinTween?.kill();
    if (opening) {
      this.spinTween = gsap.to(this.icon, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
    } else {
      this.spinTween = gsap.to(this.icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
    }
  }

  animateColor(opening) {
    if (!this.changeMenuColorOnOpen) return;
    this.colorTween?.kill();
    
    const targetColor = opening ? this.openMenuButtonColor : this.menuButtonColor;
    this.colorTween = gsap.to(this.toggleBtn, {
      color: targetColor,
      delay: 0.18,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  animateText(opening) {
    this.textAnimTween?.kill();
    
    const currentLabel = opening ? 'Menu' : 'Close';
    const targetLabel = opening ? 'Close' : 'Menu';
    const cycles = 3;
    const seq = [currentLabel];
    
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === 'Menu' ? 'Close' : 'Menu';
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    // Update the DOM to reflect sequence
    this.textInner.innerHTML = seq.map(text => `<span class="sm-toggle-line">${text}</span>`).join('');

    gsap.set(this.textInner, { yPercent: 0 });
    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;
    
    this.textAnimTween = gsap.to(this.textInner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out'
    });
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.playOpen();
    } else {
      this.playClose();
    }
    this.animateIcon(this.isOpen);
    this.animateColor(this.isOpen);
    this.animateText(this.isOpen);
  }

  closeMenu() {
    if (this.isOpen) {
      this.isOpen = false;
      this.playClose();
      this.animateIcon(false);
      this.animateColor(false);
      this.animateText(false);
    }
  }
}

// Initialise the menu when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.staggered-menu-wrapper')) {
    new StaggeredMenu({
      position: 'right',         // 'left' or 'right'
      menuButtonColor: '#fff',
      openMenuButtonColor: '#fff',
      changeMenuColorOnOpen: true
    });
  }
});
