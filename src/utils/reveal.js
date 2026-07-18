export function initReveal() {
    const elements = document.querySelectorAll(".reveal")
  
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
            // Una vez visible dejamos de observarlo
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.1, // se activa cuando el 10% del elemento es visible
        rootMargin: "0px 0px -50px 0px", // se activa un poco antes de llegar al borde
      }
    )
  
    elements.forEach((el) => observer.observe(el))
}