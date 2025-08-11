<template>
  <div class="min-h-screen flex bg-gray-100">
    <!-- Sidebar -->
    <aside
      class="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col"
    >
      <div class="h-16 flex items-center px-4 border-b">
        <span class="text-lg font-semibold">TG Moderator</span>
      </div>
      <nav class="flex-1 p-4 space-y-1">
        <NuxtLink
          to="/"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Dashboard</NuxtLink
        >
        <NuxtLink
          to="/bots"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Bots</NuxtLink
        >
        <NuxtLink
          to="/moderation/logs"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Logs</NuxtLink
        >
        <NuxtLink
          to="/config/rules"
          class="block px-3 py-2 rounded hover:bg-gray-100"
          active-class="bg-gray-100 font-medium"
          >Rules</NuxtLink
        >
      </nav>
      <div class="p-4 text-xs text-gray-500 border-t">v0.1.0</div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header
        class="h-16 bg-white border-b flex items-center justify-between px-4"
      >
        <div class="flex items-center gap-3">
          <button
            class="md:hidden p-2 rounded hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-6 h-6"
            >
              <path
                fill-rule="evenodd"
                d="M3.75 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75ZM3.75 12a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15A.75.75 0 0 1 3.75 12Zm0 6.75a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <h1 class="text-lg font-semibold">Telegram AI Moderator</h1>
        </div>
        <div class="text-sm text-gray-500">
          Status: <span class="text-green-600">Online</span>
        </div>
      </header>

      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Default layout for CRM UI
</script>
