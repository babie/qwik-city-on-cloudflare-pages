import { component$ } from "@builder.io/qwik";
import type { RequestEventLoader } from "@builder.io/qwik-city";
import {
  type DocumentHead,
  routeLoader$,
  routeAction$,
  zod$,
  z,
  Form,
} from "@builder.io/qwik-city";
import styles from "./todolist.module.css";
import { type PlatformCloudflarePages } from "@builder.io/qwik-city/middleware/cloudflare-pages";
import { binding } from "cf-bindings-proxy";
import { type KVNamespace } from "@cloudflare/workers-types";

export interface Env {
  QOC_KV_DEV: KVNamespace;
}

interface ListItem {
  text: string;
}

export const list: ListItem[] = [];

export const useListLoader = routeLoader$(
  async ({ platform }: RequestEventLoader<PlatformCloudflarePages>) => {
    const kv = binding<KVNamespace>("QOC_KV_DEV", {
      fallback: platform.env as Record<string, unknown>,
    });
    const todos = (await kv.get<ListItem[]>("todos", "json")) || [];
    return todos;
  }
);

export const useAddToListAction = routeAction$(
  async (item, { platform }) => {
    const kv = binding<KVNamespace>("QOC_KV_DEV", {
      fallback: platform.env as Record<string, unknown>,
    });
    const prevTodos = await kv.get<ListItem[]>("todos", "json");
    const nextTodos = prevTodos ? [...prevTodos, item] : [];
    await kv.put("todos", JSON.stringify(nextTodos));
    return {
      success: true,
    };
  },
  zod$({
    text: z.string().trim().min(1),
  })
);

export default component$(() => {
  const list = useListLoader();
  const action = useAddToListAction();

  return (
    <>
      <div class="container container-center">
        <h1>
          <span class="highlight">TODO</span> List
        </h1>
      </div>

      <div role="presentation" class="ellipsis"></div>

      <div class="container container-center">
        {list.value.length === 0 ? (
          <span class={styles.empty}>No items found</span>
        ) : (
          <ul class={styles.list}>
            {list.value.map((item, index) => (
              <li key={`items-${index}`}>{item.text}</li>
            ))}
          </ul>
        )}
      </div>

      <div class="container container-center">
        <Form action={action} spaReset>
          <input type="text" name="text" required class={styles.input} />{" "}
          <button type="submit" class="button-dark">
            Add item
          </button>
        </Form>

        <p class={styles.hint}>
          PS: This little app works even when JavaScript is disabled.
        </p>
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Qwik Todo List",
};
