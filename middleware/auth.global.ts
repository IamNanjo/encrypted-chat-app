export default defineNuxtRouteMiddleware((to, from) => {
    if (process.client) return;

    const authPages = [ "/login", "/register" ];
    if (!authPages.includes(to.path)) return navigateTo("/login");
})
