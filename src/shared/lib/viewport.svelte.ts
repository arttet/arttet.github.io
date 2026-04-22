import { site } from '$shared/config/site';

class ViewportState {
  // -1 means mouse is not active or outside the window
  mouseY = $state(-1);
  winHeight = $state(768);
  scrollDir = $state<'up' | 'down'>('up');
  private lastScrollY = 0;

  navVisible = $derived(this.mouseY >= 0 && this.mouseY < site.nav.hideThreshold);
  footerVisible = $derived(
    this.mouseY >= 0 && this.mouseY > this.winHeight - site.nav.hideThreshold
  );

  updateMouseY(y: number) {
    this.mouseY = y;
  }

  updateScroll(y: number) {
    const diff = y - this.lastScrollY;
    const threshold = 15; // px to consider scroll intentional

    if (y < 50) {
      this.scrollDir = 'up';
    } else if (Math.abs(diff) > threshold) {
      this.scrollDir = diff > 0 ? 'down' : 'up';
    }

    this.lastScrollY = y;
  }
}

export const viewport = new ViewportState();
