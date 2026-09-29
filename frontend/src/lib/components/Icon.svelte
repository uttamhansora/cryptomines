<script lang="ts">
  /**
   * Central Icon component. Every icon in the game resolves through the
   * registry in src/lib/icons.ts — custom, locally authored SVG assets only.
   */
  import { ICONS, type IconName } from '../icons';

  interface Props {
    name: IconName;
    size?: number;
    label?: string;
    class?: string;
  }
  let { name, size = 20, label = '', class: cls = '' }: Props = $props();

  const src = $derived(ICONS[name]);

  // Dev guard: a registry value must be an imported asset URL/data-URI, never
  // a bare icon name. If this ever regresses we fail loudly instead of
  // silently rendering <img src="bitcoin">.
  if (import.meta.env.DEV && typeof src === 'string' && !/^(\/|\.\/|\.\.\/|data:|https?:|blob:)/.test(src)) {
    console.error(`[Icon] registry value for "${name}" is not an asset URL:`, src);
  }
</script>

<img
  class="icon {cls}"
  src={src}
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
  }
</style>
