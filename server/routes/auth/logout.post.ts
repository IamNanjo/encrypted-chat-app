export default defineEventHandler(async (e) => {
    const session = e.context.session;
    if (session) await session.clear();
    await sendRedirect(e, "/login");
});
