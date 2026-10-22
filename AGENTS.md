<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All shop/order data goes through src/lib/shop-store.ts (localStorage mock); swap its functions for real API calls when a backend is added — keeps UI untouched.
- Customer upload page lives at /s/$shopId outside the dashboard layout; customers never need an account.
