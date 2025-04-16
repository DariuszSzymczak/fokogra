<script>
import GameCanvas from './components/GameCanvas.vue'

export default {
  name: 'App',
  components: {
    GameCanvas
  }
}
</script>

<template>
  <div id="app">
    <GameCanvas />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
}
</style>
