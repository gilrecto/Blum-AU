class LazyVideo extends HTMLElement {
	constructor() {
		super();
		this.video = this.querySelector(".video-player");
		this.srcDesktop = this.getAttribute("src-desktop");
		this.srcMobile = this.getAttribute("src-mobile");
		this.poster = this.video.getAttribute('poster');
		this.currentSrc = "";
		this.isLoaded = false;
		this.handleResize = this.handleResize.bind(this);
	}

	connectedCallback() {
		this.initObserver();
		window.addEventListener("resize", this.handleResize);
	}

	disconnectedCallback() {
		window.removeEventListener("resize", this.handleResize);
		if (this.observer) this.observer.disconnect();
	}

	initObserver() {
		this.observer = new IntersectionObserver((entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !this.isLoaded) {
					this.loadVideo();
					observer.unobserve(this);
				}
			});
		}, { threshold: 0.5 });

		this.observer.observe(this);
	}

	getVideoSource() {
		return window.innerWidth > 767 ? this.srcDesktop : this.srcMobile;
	}

	loadVideo() {
		const newSrc = this.getVideoSource();
		this.video.pause();

		if (newSrc == this.srcMobile) {
			this.video.poster = this.video.getAttribute('data-mobile-poster');
		} else {
			this.video.poster = this.poster;
		}

		if (newSrc !== this.currentSrc) {
			this.video.src = newSrc;
			this.currentSrc = newSrc;

			const onCanPlay = () => {
				this.video.removeEventListener('canplay', onCanPlay);
				this.video.play().then(() => {
					this.isLoaded = true;
				}).catch(err => console.error("Video play failed:", err));
			};

			this.video.addEventListener('canplay', onCanPlay);
			this.video.load();
		} else {
			this.video.load();
		}
	}

	handleResize() {
		if (this.isLoaded) this.loadVideo();
	}
}

customElements.define("lazy-video", LazyVideo);