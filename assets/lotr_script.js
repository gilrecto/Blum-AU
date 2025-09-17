const circleAnimate = (selector, pseudo_element, delay = 0, duration = 35000) => {
  const section = document.querySelector(selector);
  
  section.animate(
    { rotate: ["0deg", "360deg"] },
    {
      duration: duration,
      delay: delay,
      pseudoElement: pseudo_element,
      iterations: Infinity
    }
  );
}

const scrollToAnimate = (el, animClass, threshold = 0) => {
  let element = document.querySelector(el);
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add(animClass);
      }
    });
  }, { threshold: threshold });

  observer.observe(element);
}