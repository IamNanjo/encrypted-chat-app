export default defineNuxtRouteMiddleware(async () => {
	if (process.client) return;

	const { session } = await useSession();
	if (!("userId" in session)) return navigateTo("/login");
});
