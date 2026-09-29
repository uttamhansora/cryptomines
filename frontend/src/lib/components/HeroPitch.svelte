<section class="pitch" aria-label="How to play">
  <h1 class="title">Crypto Mines</h1>
  <p class="tagline">Reveal. Multiply. Cash Out.</p>
  <ol class="steps">
    <li><span class="num">1</span> Choose bet &amp; mines</li>
    <li><span class="num">2</span> Reveal safe tiles — multiplier grows</li>
    <li><span class="num">3</span> Avoid mines · Cash out anytime</li>
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
    background: linear-gradient(180deg, #f4e9c8, var(--highlight));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
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
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  .steps li {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .num {
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    font-family: var(--font-display);
    font-size: 0.6rem;
    color: var(--bg-primary);
    background: linear-gradient(160deg, var(--accent-secondary), var(--emerald-light));
    box-shadow: 0 0 8px var(--glow-emerald);
  }
  @media (min-width: 1024px) {
    .pitch {
      text-align: left;
    }
    .steps li {
      align-self: flex-start;
    }
  }
</style>
