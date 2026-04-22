---
name: Monday Label Constraints
description: Exact casing and spelling for status and contract labels on board 7854209602
type: constraint
---
Monday.com status labels (status0__1) must exactly match labels existing on the board: 'TRAMASSOIDH', 'TRADICIONAL', 'INFORMATIVO', 'COMPILADO', 'VAGA INTERNA', 'WEG', 'Marisa', 'Marisa COMPILADO', 'DM'.

The board does NOT allow create_labels_if_missing — unknown labels are rejected with error.

**Mutirão mapping:** modelo_cartaz `mutirao-tradicional` and `mutirao-bombril` are mapped to Monday label `COMPILADO` (no MUTIRÃO label exists on the board). If a MUTIRÃO label is added to the board later, update `getModeloLabel` in `supabase/functions/_shared/monday.ts`.

Contract labels (status__1) must be feminine: 'Efetiva', 'Temporária', 'PJ', 'Estágio', 'Terceirizada', 'Compilado'.

**Why:** Monday API rejects unknown status labels with `"This status label doesn't exist"` and breaks the integration.
