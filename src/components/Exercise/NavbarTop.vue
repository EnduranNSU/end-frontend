<template>
  <div class="exercise-header q-mb-md">
    <div class="title q-mb-sm">{{ props.title }}</div>
    <div class="navbar">
      <ul class="menu row items-center">
        <li class="menu-item" v-for="item in bottomMenu" :key="item" :class="{ active: active === item }"
          @click="setActive(item)">
          <span class="menu-label">{{ item }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'NavbarTop',
  props: {
    title: { type: String, default: 'Exercise' },
    backRoute: { type: String, default: '' },
    hideTabs: { type: Boolean, default: false },
  },
  emits: ['section-change'],
  setup(props, { emit }) {
    const router = useRouter();
    const bottomMenu = props.hideTabs ? [] : ['Описание', 'История'];
    const active = ref<string>(bottomMenu[0] ?? '');

    function setActive(item: string) {
      if (props.hideTabs) return;
      active.value = item;
      emit('section-change', item);
    }

    async function onReturn() {
      if (props.backRoute) await router.push(props.backRoute);
      else router.back();
    }

    function onMore() {
      console.log('More clicked');
    }

    return {
      bottomMenu,
      active,
      setActive,
      onReturn,
      onMore,
      props,
    };
  },
});
</script>

<style scoped>
.exercise-header {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  font-weight: 500;
  padding: 0 16px;
  position: relative;
  text-align: center;
}

.navbar {
  background: rgb(108, 117, 125);
  border-radius: 10vw;
  padding: 8px 16px;
  display: flex;
}

.menu {
  display: flex;
  gap: 20px;
  padding: 0;
  margin: 0;
  list-style: none;
  width: 100%;
  justify-content: center;
}

.menu-item {
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
  text-align: center;
  color: rgba(233, 247, 246, 0.7);
}

.menu-item:hover {
  color: white;
}

.menu-item.active {
  font-weight: 500;
  color: #e9f7f6;
}

.menu-label {
  position: relative;
  display: inline-block;
  font-size: 16px;
}
</style>
