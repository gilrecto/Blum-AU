document.addEventListener("DOMContentLoaded", function() {
  var lazyVideos = [].slice.call(document.querySelectorAll("video.lazy"));

  if ("IntersectionObserver" in window) {
    var lazyVideoObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(video) {
        if (video.isIntersecting) {
          for (var source in video.target.children) {
            var videoSource = video.target.children[source];
            if (typeof videoSource.tagName === "string" && videoSource.tagName === "SOURCE") {
              videoSource.src = videoSource.dataset.src;
						}
          }

          video.target.load();
          video.target.classList.remove("lazy");
          lazyVideoObserver.unobserve(video.target);
        }
      });
    });

    lazyVideos.forEach(function(lazyVideo) {
      lazyVideoObserver.observe(lazyVideo);
    });
  }

  const root = document.documentElement;
  const rootStyles = window.getComputedStyle(root);
  const headerHeight = parseInt(rootStyles.getPropertyValue('--header-height'), 10);

  const smoothScroll = (id, updateUrl = true) => {
    const element = document.getElementById(id);
    if (element) {
      const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = targetPosition - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      if (updateUrl) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  const closeAllMegaMenus = () => {
    document.querySelectorAll('sht-menu-header details[open]').forEach(details => {
      details.removeAttribute('open');
    });
  };

  if (window.location.hash) {
    const targetId = window.location.hash.substring(1);

    window.scrollTo(0, 0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => smoothScroll(targetId));
    });
  }

  const anchors = document.querySelectorAll('a[href*="#"]');
  anchors.forEach(anchor => {
    anchor.addEventListener('click', event => {
      const href = anchor.getAttribute('href');
      const parts = href.split('#');

      if (parts.length > 1) {
        const targetPage = parts[0];
        const targetId = parts[1];

        if (!targetPage || targetPage === window.location.pathname) {
          event.preventDefault();
          smoothScroll(targetId);
          closeAllMegaMenus();
          document.querySelector('sht-menu-drwer')?.removeAttribute('open');
        }
      }
    });
  });
});