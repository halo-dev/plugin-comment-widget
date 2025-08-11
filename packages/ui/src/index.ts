import { VLoading } from '@halo-dev/components';
import { definePlugin } from '@halo-dev/console-shared';
import { defineAsyncComponent, markRaw } from 'vue';

export default definePlugin({
  components: {},
  routes: [],
  extensionPoints: {
    'comment:editor:replace': () => {
      return {
        component: markRaw(
          defineAsyncComponent({
            loader: () => import('./components/Editor.vue'),
            loadingComponent: VLoading,
          })
        ),
      };
    },
  },
});
