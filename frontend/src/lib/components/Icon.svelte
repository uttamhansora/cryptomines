<script lang="ts">
  /**
   * Shared icon component. Icons are sourced from Icons8 (https://icons8.com/icons)
   * and bundled locally under public/assets/game/ui/icons for offline + in-canvas use.
   */
  interface Props {
    name: string;
    size?: number;
    label?: string;
    class?: string;
  }
  let { name, size = 20, label = '', class: cls = '' }: Props = $props();
</script>

<img
  class="icon {cls}"
  src="./assets/game/ui/icons/{name}.png"
  width={size}
  height={size}
  alt={label}
  aria-hidden={label ? undefined : 'true'}
  loading="lazy"
  decoding="async"
/>

<style>
  .icon {
    display: inline-block;
    vertical-align: middle;
    object-fit: contain;
    flex-shrink: 0;
    pointer-events: none;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  }
</style>
