import { VLoading } from '@halo-dev/components';
import { definePlugin } from '@halo-dev/ui-shared';
import { defineAsyncComponent, markRaw } from 'vue';

const Editor = markRaw(
  defineAsyncComponent({
    loader: () => import('./components/Editor.vue'),
    loadingComponent: VLoading,
  })
);
const Content = markRaw(
  defineAsyncComponent({
    loader: () => import('./components/Content.vue'),
  })
);

export default definePlugin({
  components: {},
  routes: [],
  extensionPoints: {
    'comment:editor:replace': () => {
      return {
        component: Editor,
      };
    },
    'comment:list-item:content:replace': () => {
      return {
        component: Content,
      };
    },
  },
});
