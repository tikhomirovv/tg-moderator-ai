export default defineNuxtPlugin(() => {
  const route = useRoute();
  const refCode = route.query.ref;

  if (typeof refCode !== "string" || !refCode.trim()) {
    return;
  }

  $fetch("/api/referral/attribution", {
    method: "POST",
    body: { code: refCode.trim() },
  }).catch(() => {
    // Ignore invalid referral codes in the query string.
  });
});
