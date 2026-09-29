<section class="pitch" aria-label="How to play">
  <h1 class="title">Crypto Mines</h1>
  <p class="tagline">Reveal. Multiply. Cash Out.</p>
  <ol class="steps">
    <li>Choose bet &amp; mines</li>
    <li>Reveal safe tiles — multiplier grows</li>
    <li>Avoid mines · Cash out anytime</li>
  </ol>
</section>

<style>
  .pitch {
    text-align: center;
    padding: var(--space-sm) 0;
  }
  .title {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.1rem, 4vw, 1.5rem);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .tagline {
    margin: 0.35rem 0 0.5rem;
    color: var(--accent-primary);
    font-weight: 600;
    font-size: 0.95rem;
  }
  .steps {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  @media (min-width: 1024px) {
    .pitch {
      text-align: left;
    }
    .steps {
      align-items: flex-start;
    }
  }
</style>
