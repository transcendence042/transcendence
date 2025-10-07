interface Route {
    path: string;
    view: () => void;
}
declare const routes: Route[];
declare function router(): void;
declare function navigate(path: string): void;
declare function renderRoute(path: string): void;
declare function showHome(): void;
declare function showLogin(): void;
declare function showRegister(): void;
declare function showProfile(): void;
declare function showFriends(): void;
declare function showNotFound(): void;
