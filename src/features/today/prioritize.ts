import type { DemoAttentionItem } from "./demo-data";

const priorityRank: Record<DemoAttentionItem["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
};

export function prioritizeAttentionItems(items: readonly DemoAttentionItem[]) {
  return [...items].sort(
    (left, right) => priorityRank[left.priority] - priorityRank[right.priority],
  );
}
