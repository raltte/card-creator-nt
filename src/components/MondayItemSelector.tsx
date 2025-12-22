import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, Check, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MondayItem {
  id: string;
  name: string;
  codigo: string;
}

interface MondayItemSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MondayItem) => void;
  onCreateNew: (groupId: string) => void;
}

export const MondayItemSelector = ({ open, onClose, onSelect, onCreateNew }: MondayItemSelectorProps) => {
  const [items, setItems] = useState<MondayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MondayItem | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchItems();
    }
  }, [open]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('listar-items-monday');

      if (error) throw error;

      setItems(data.items || []);
      setGroupId(data.groupId || null);
    } catch (error) {
      console.error('Erro ao buscar items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedItem) {
      onSelect(selectedItem);
      onClose();
    }
  };

  const handleCreateNew = () => {
    if (groupId) {
      onCreateNew(groupId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Selecionar Linha do Monday</DialogTitle>
          <DialogDescription>
            Escolha uma linha existente no grupo "Pedidos" ou crie uma nova
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md">
              {/* Opção de criar nova linha */}
              {groupId && (
                <button
                  onClick={handleCreateNew}
                  className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 transition-colors text-left border-b bg-primary/5"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">Criar nova linha</p>
                    <p className="text-sm text-muted-foreground">
                      Adicionar novo item no grupo "Pedidos"
                    </p>
                  </div>
                </button>
              )}

              {filteredItems.length === 0 && !groupId ? (
                <div className="p-4 text-center text-muted-foreground">
                  Grupo "Pedidos" não encontrado ou vazio
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhum item encontrado com esse filtro
                </div>
              ) : (
                <div className="divide-y">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full flex items-center justify-between p-3 hover:bg-muted transition-colors text-left ${
                        selectedItem?.id === item.id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.codigo && (
                          <p className="text-sm text-muted-foreground">
                            Código: {item.codigo}
                          </p>
                        )}
                      </div>
                      {selectedItem?.id === item.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedItem}>
            Confirmar Seleção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
