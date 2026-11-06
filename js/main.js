// Entry point.
(function () {
  // Polyfill for older browsers (roundRect is used for UI panels and limbs).
  const proto = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
  if (proto && !proto.roundRect) {
    proto.roundRect = function (x, y, w, h, r) {
      r = Math.min(typeof r === 'number' ? r : 0, Math.abs(w) / 2, Math.abs(h) / 2);
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  window.addEventListener('load', () => {
    SS.Engine.init();
    SS.Engine.setScene(new SS.MenuScene());
  });
})();
