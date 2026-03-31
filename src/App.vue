<template>
  <router-view />
</template>

<style>
:root {
  --primary: #8e7dff;
  --bg-dark: #0f172a;
}

body {
  margin: 0;
  font-family: sans-serif;
  background-color: var(--bg-dark);
  color: white;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(142, 125, 255, 0.3);
}

/* Firefox scrollbar */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.05) transparent;
}

/* Global dialog styling */
.glass-dialog {
  border-radius: 25px !important;
  background: rgba(30, 41, 59, 0.9) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
}

/* Global animation classes */
.animate-fade-in {
  animation: fadeIn 0.5s ease both;
}

.animate-pop-in {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>
