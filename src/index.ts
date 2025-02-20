/* eslint-disable @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call */
import { isVue3 } from "vue-demi";
import type { DirectiveBinding, Plugin } from "vue-demi";
import Sticky, { StickyNamespace } from "./sticky";
import type { StickyOptions } from "./sticky";

const directiveHooks = {
  mounted: (isVue3 ? "mounted" : "inserted") as "mounted",
  updated: (isVue3 ? "updated" : "componentUpdated") as "updated",
  beforeUnmount: (isVue3 ? "beforeUnmount" : "unbind") as "beforeUnmount",
};

const directive = {
  [directiveHooks.mounted](el: any, bind: DirectiveBinding<StickyOptions>) {
    if (bind.value === undefined || bind.value) {
      el[StickyNamespace] = new Sticky(el as HTMLElement, bind.value);
    }
  },
  [directiveHooks.updated](el: any, bind: DirectiveBinding<StickyOptions>) {
    if (el[StickyNamespace]) {
      el[StickyNamespace].updateOptions(bind.value);
    }
  },
  [directiveHooks.beforeUnmount](el: any) {
    if (el[StickyNamespace]) {
      el[StickyNamespace].doUnbind();
      el[StickyNamespace] = undefined;
    }
  },
};

const plugin: Plugin = {
  install: (app) => {
    app.directive("Sticky", directive);
  },
};

export default plugin;
export { Sticky, StickyOptions };
