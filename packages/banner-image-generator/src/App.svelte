<script>
  import { HEIGHT, WIDTH } from "./config";

  const height = `${HEIGHT}px`
  const width = `${WIDTH}px`
</script>

<main style:--width={width} style:--height={height}>
  <h1 class="text">Pin Go Installed Package Version</h1>
  <footer>https://xeptore.blog</footer>
</main>

<style lang="sass">
main
  color: whitesmoke
  font-family: 'Lato'
  background-color: #161618
  position: relative
  display: flex
  align-items: center
  justify-content: center
  width: var(--width)
  height: var(--height)

footer
  position: absolute
  font-size: x-large
  right: 15px
  bottom: 15px

.text
  margin: 0
  padding: 0
  font-size: 6rem
  text-align: center
  font-family: 'Merriweather'
  font-style: normal
  font-weight: 700
</style>
