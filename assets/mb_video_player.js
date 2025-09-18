const videoPlayer = (selector) => {
  const video = document.querySelector(selector),
      datasrc = video.dataset.src;
  let playState = null;

  video.src = datasrc;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        video.pause();
        playState = false;
      } else {
        video.play();
        playState = true;
      }
    });
  }, {threshold: 0.75});

  observer.observe(video);

  const onVisibilityChange = () => {
      if (document.hidden || !playState) {
      video.pause();
      } else {
      video.play();
      }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
}