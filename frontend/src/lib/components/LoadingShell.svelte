<div class="load" role="status" aria-label="Loading Crypto Mines">
  <div class="logo">
    <span class="mark"></span>
    <span class="word">CRYPTO MINES</span>
  </div>
  <div class="bar"><span></span></div>
</div>

<style>
  .load {
    min-height: 50vh;
    display: grid;
    place-content: center;
    gap: var(--space-lg);
  }
  .logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
  }
  .mark {
    width: 14px;
    height: 14px;
    background: var(--accent-primary);
    transform: rotate(45deg);
    box-shadow: 0 0 16px var(--glow-red);
  }
  .word {
    font-family: var(--font-display);
    letter-spacing: 0.28em;
    font-size: 0.85rem;
    color: var(--text-primary);
  }
  .bar {
    width: 120px;
    height: 2px;
    background: var(--border);
    border-radius: 1px;
    overflow: hidden;
    margin: 0 auto;
  }
  .bar span {
    display: block;
    width: 40%;
    height: 100%;
    background: var(--accent-primary);
    animation: load 0.9s ease-in-out infinite;
  }
  @keyframes load {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(300%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bar span {
      animation: none;
      width: 100%;
    }
  }
</style>
