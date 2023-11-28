export default defineNuxtRouteMiddleware(async (to) => {
	const { session } = await useSession();
	const authPages = ["/login", "/register"];
	if (!("userId" in session) && !authPages.includes(to.path))
		return navigateTo("/login");
	if ("userId" in session && authPages.includes(to.path))
		return navigateTo("/");
});
