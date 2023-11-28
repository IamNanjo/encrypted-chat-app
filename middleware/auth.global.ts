export default defineNuxtRouteMiddleware(async (to) => {
	if (process.client) return;
	const { session } = await useSession();
	const authPages = ["/login", "/register"];
	if (!("userId" in session) && !authPages.includes(to.path))
		return navigateTo("/login");
	if ("userId" in session && authPages.includes(to.path))
		return navigateTo("/");
});
