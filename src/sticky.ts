import { nextTick } from "vue-demi";

export const StickyNamespace = "@@vue-sticky-directive";
const events = [
  "resize",
  "scroll",
  "touchstart",
  "touchmove",
  "touchend",
  "pageshow",
  "load",
];

const stylePropWithPixel = [
  "width",
  "top",
  "left",
  "right",
  "bottom",
  "paddingTop",
];

export enum StickySide {
  TOP = "top",
  BOTTOM = "bottom",
  BOTH = "both",
}

interface CallbackState {
  top: boolean
  bottom: boolean
  sticked: boolean
}

type Listeners = () => void;
type CallbackArrow = (state?: CallbackState) => void;

export interface StickyOptions {
  topOffset?: number
  bottomOffset?: number
  side?: StickySide
  zIndex?: number
  on?: CallbackArrow
}

const DefaultOptions = {
  topOffset: 0,
  bottomOffset: 0,
  shouldTopSticky: false,
  shouldBottomSticky: false,
  zIndex: 10,
  on: () => {},
};

type RecordStyle = Record<string, string | number>;
type RecordClassNames = Record<string, boolean>;

function convertProp(name: string, prop: string | number) {
  if (typeof prop === "string") {
    return prop;
  }
  prop = prop.toString(10);
  return stylePropWithPixel.includes(name) ? `${prop}px` : prop;
}

function batchStyle(el?: HTMLElement | null, style: RecordStyle = {}, className: RecordClassNames = {}) {
  if (!el) {
    return;
  }
  for (const k in style) {
    el.style.setProperty(k, convertProp(k, style[k]));
  }
  for (const k in className) {
    if (className[k] && !el.classList.contains(k)) {
      el.classList.add(k);
    } else if (!className[k] && el.classList.contains(k)) {
      el.classList.remove(k);
    }
  }
}

class Sticky {
  private readonly el: HTMLElement;
  private readonly containerEl: HTMLElement;
  private readonly placeholderEl: HTMLElement;
  private listeners: Listeners[] = [];
  private isPending = false;
  private state;
  private callbackState: CallbackState;
  private options = DefaultOptions;

  constructor(el: HTMLElement, options: StickyOptions = {}) {
    this.el = el;
    this.state = {
      isTopSticky: false,
      isBottomSticky: false,
      height: 0,
      width: 0,
      xOffset: 0,
      placeholderElTop: 0,
      containerElTop: 0,
      containerElBottom: 0,
    };

    this.callbackState = {
      top: false,
      bottom: false,
      sticked: false,
    };

    this.setOptions(options);

    this.containerEl = this.getContainerEl();

    const parent = this.el.parentNode || this.containerEl;
    this.placeholderEl = document.createElement("div");
    parent.insertBefore(this.placeholderEl, this.el);

    this.setListeners().then(() => {}, () => {});
  }

  private setOptions(options: StickyOptions = {}) {
    const side
      = (options.side && [StickySide.TOP, StickySide.BOTTOM, StickySide.BOTH].includes(options.side))
        ? options.side
        : StickySide.TOP;
    this.options = {
      topOffset: Number(options.topOffset) || DefaultOptions.topOffset,
      bottomOffset: Number(options.bottomOffset) || DefaultOptions.bottomOffset,
      shouldTopSticky: side === StickySide.TOP || side === StickySide.BOTH,
      shouldBottomSticky: side === StickySide.BOTTOM || side === StickySide.BOTH,
      zIndex: Number(options.zIndex) || DefaultOptions.zIndex,
      on: options.on || DefaultOptions.on,
    };
  }

  private async setListeners() {
    if (this.listeners.length > 0) {
      return;
    }
    const fn = this.update.bind(this);
    await nextTick(() => {
      const containers = [window, this.containerEl];
      events.forEach((event) => {
        containers.forEach((container) => {
          this.listeners.push(() => container?.removeEventListener(event, fn));
          container?.addEventListener(event, fn, { passive: true });
        });
      });
    });
  }

  public doUnbind() {
    this.listeners.forEach(fn => fn());
    this.listeners = [];
    this.resetElement();
  }

  public updateOptions(options: StickyOptions = {}) {
    this.setOptions(options);
    this.recomputeState();
    this.updateElements();
  }

  private update() {
    if (!this.isPending) {
      requestAnimationFrame(() => {
        this.isPending = false;
        this.recomputeState();
        this.updateElements();
      });
      this.isPending = true;
    }
  }

  private isTopSticky() {
    if (!this.options.shouldTopSticky) {
      return false;
    }

    const fromTop = this.state.placeholderElTop;
    const fromBottom = this.state.containerElBottom;

    const topBreakpoint = this.options.topOffset;
    const bottomBreakpoint = this.options.bottomOffset;

    return fromTop <= topBreakpoint && fromBottom >= bottomBreakpoint;
  }

  private isBottomSticky() {
    if (!this.options.shouldBottomSticky) {
      return false;
    }

    const fromBottom
      = window.innerHeight
      - this.state.placeholderElTop
      - this.state.height;
    const fromTop = window.innerHeight - this.state.containerElTop;

    const topBreakpoint = this.options.topOffset;
    const bottomBreakpoint = this.options.bottomOffset;

    return fromBottom <= bottomBreakpoint && fromTop >= topBreakpoint;
  }

  private recomputeState() {
    const elRect = this.el.getBoundingClientRect();
    const placeholderElRect = this.placeholderEl.getBoundingClientRect();
    const containerElRect = this.containerEl.getBoundingClientRect();
    this.state = Object.assign({}, this.state, {
      height: elRect.height,
      width: placeholderElRect.width,
      xOffset: placeholderElRect.left,
      placeholderElTop: placeholderElRect.top,
      containerElTop: containerElRect.top,
      containerElBottom: containerElRect.bottom,
    });
    this.state.isTopSticky = this.isTopSticky();
    this.state.isBottomSticky = this.isBottomSticky();
  }

  private fireEvents() {
    if (
      typeof this.options.on === "function"
      && (this.callbackState.top !== this.state.isTopSticky
        || this.callbackState.bottom !== this.state.isBottomSticky
        || this.callbackState.sticked
        !== (this.state.isTopSticky || this.state.isBottomSticky))
    ) {
      this.callbackState = {
        top: this.state.isTopSticky,
        bottom: this.state.isBottomSticky,
        sticked: this.state.isBottomSticky || this.state.isTopSticky,
      };
      this.options.on();
    }
  }

  private updateElements() {
    const placeholderStyle: RecordStyle = { paddingTop: 0 };
    const elStyle: RecordStyle = {
      position: "static",
      top: "auto",
      bottom: "auto",
      left: "auto",
      width: "auto",
      zIndex: this.options.zIndex,
    };
    const placeholderClassName: RecordClassNames = { "vue-sticky-placeholder": true };
    const elClassName: RecordClassNames = {
      "vue-sticky-el": true,
      "top-sticky": false,
      "bottom-sticky": false,
    };

    const limit
      = this.state.height
      + this.options.bottomOffset
      + this.options.topOffset;

    if (this.state.isTopSticky || this.state.isBottomSticky) {
      elStyle.position = "fixed";
      elStyle.left = this.state.xOffset;
      elStyle.width = this.state.width;
      placeholderStyle.paddingTop = this.state.height;
    } else {
      placeholderStyle.paddingTop = 0;
    }

    if (this.state.isTopSticky) {
      elClassName["top-sticky"] = true;

      elStyle.top = this.options.topOffset;
      const bottomLimit = this.state.containerElBottom - limit;
      if (bottomLimit < 0) {
        elStyle.top += bottomLimit;
      }
    }

    if (this.state.isBottomSticky) {
      elClassName["bottom-sticky"] = true;

      elStyle.bottom = this.options.bottomOffset;
      const topLimit = window.innerHeight - this.state.containerElTop - limit;
      if (topLimit < 0) {
        elStyle.bottom += topLimit;
      }
    }

    batchStyle(this.el, elStyle, elClassName);
    batchStyle(this.placeholderEl, placeholderStyle, placeholderClassName);

    this.fireEvents();
  }

  private resetElement() {
    ["position", "top", "bottom", "left", "width", "zIndex"].forEach((attr) => {
      this.el.style.removeProperty(attr);
    });
    this.el.classList.remove("bottom-sticky", "top-sticky");
    this.placeholderEl?.parentNode?.removeChild(this.placeholderEl);
  }

  private getContainerEl() {
    let node = this.el.parentElement;
    while (
      node
      && node.tagName !== "HTML"
      && node.tagName !== "BODY"
      && node.nodeType === 1
    ) {
      if (node.hasAttribute("sticky-container")) {
        return node;
      }
      node = node.parentElement;
    }
    return this.el.parentElement ?? document.body;
  }
}

export default Sticky;
