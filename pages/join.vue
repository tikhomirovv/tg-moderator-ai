<script setup lang="ts">
const route = useRoute();

const query: Record<string, string> = { add: "join" };
const code = route.query.code;
if (typeof code === "string" && code.trim()) {
  query.code = code.trim();
}

await navigateTo({ path: "/bots", query });
</script>
