import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Event, PendingSale, EventCost, EventSponsorship } from '../types';

const COLLECTION_NAME = 'eventos';

export const addEvent = async (event: Omit<Event, 'id'>) => {
  return await addDoc(collection(db, COLLECTION_NAME), {
    ...event,
    lotes: event.lotes || [],
    custos: [],
    patrocinios: [],
    dataCriacao: new Date().toISOString()
  });
};

export const updateEvent = async (id: string, event: Partial<Event>) => {
  const eventRef = doc(db, COLLECTION_NAME, id);
  return await updateDoc(eventRef, event);
};

export const addEventCost = async (eventoId: string, cost: EventCost) => {
  const eventRef = doc(db, COLLECTION_NAME, eventoId);
  return await updateDoc(eventRef, {
    custos: arrayUnion(cost)
  });
};

export const addEventSponsorship = async (eventoId: string, sponsorship: EventSponsorship) => {
  const eventRef = doc(db, COLLECTION_NAME, eventoId);
  return await updateDoc(eventRef, {
    patrocinios: arrayUnion(sponsorship)
  });
};

export const deleteEvent = async (id: string) => {
  const eventRef = doc(db, COLLECTION_NAME, id);
  return await deleteDoc(eventRef);
};

export const registerPendingSale = async (eventoId: string, sale: Omit<PendingSale, 'id'>) => {
  // 1. Salvar participante no evento para organização da lista
  const participantsRef = collection(db, `${COLLECTION_NAME}/${eventoId}/participantes`);
  await addDoc(participantsRef, {
    nomeComprador: sale.participanteNome,
    telefone: sale.participanteTelefone,
    lote: sale.nomeLote,
    valorUnitario: sale.valorUnitario,
    quantidade: sale.quantidadeIngressos,
    valorTotal: sale.valorTotal,
    registradoPor: sale.registradoPorNome,
    usuarioId: sale.registradoPorId,
    dataRegistro: new Date().toISOString()
  });

  // 2. Gerar registro financeiro pendente na coleção global
  const salesRef = collection(db, 'vendasPendentes');
  return await addDoc(salesRef, {
    ...sale,
    dataRegistro: new Date().toISOString(),
    status: 'pendente'
  });
};

export const getPendingSales = async () => {
  const salesRef = collection(db, 'vendasPendentes');
  const q = query(salesRef, where('status', '==', 'pendente'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingSale));
};

export const updatePendingSaleStatus = async (
  saleId: string, 
  status: 'confirmado' | 'rejeitado', 
  confirmadoPor?: string,
  motivoRejeicao?: string
) => {
  const saleRef = doc(db, 'vendasPendentes', saleId);
  const saleSnap = await getDoc(saleRef);
  
  if (!saleSnap.exists()) throw new Error('Venda não encontrada');
  const saleData = saleSnap.data() as PendingSale;

  // 1. Atualizar status da venda
  await updateDoc(saleRef, {
    status,
    confirmadoPor,
    motivoRejeicao,
    dataConfirmacao: new Date().toISOString()
  });

  // 2. Se confirmado, criar movimentação financeira
  if (status === 'confirmado') {
    const movimentacoesRef = collection(db, 'movimentacoes');
    await addDoc(movimentacoesRef, {
      tipo: 'entrada',
      categoriaId: 'eventos', // Categoria padrão para eventos
      categoriaNome: 'Eventos',
      eventoId: saleData.eventoId,
      eventoNome: saleData.nomeEvento,
      descricao: `Venda de ingressos - ${saleData.lote || saleData.nomeLote} - ${saleData.nomeEvento}`,
      valor: saleData.valorTotal,
      responsavel: saleData.registradoPorNome || saleData.nomeVendedor,
      usuarioId: saleData.registradoPorId || saleData.usuarioId,
      usuarioNome: saleData.registradoPorNome || saleData.nomeVendedor,
      confirmadoPor,
      data: new Date().toISOString(),
      dataConfirmacao: new Date().toISOString()
    });

    // 3. Atualizar quantidade vendida no lote do evento
    const eventRef = doc(db, COLLECTION_NAME, saleData.eventoId);
    const eventSnap = await getDoc(eventRef);
    if (eventSnap.exists()) {
      const eventData = eventSnap.data() as Event;
      const updatedLotes = (eventData.lotes || []).map(l => {
        if (l.id === saleData.loteId) {
          return { ...l, quantidadeVendida: (l.quantidadeVendida || 0) + saleData.quantidadeIngressos };
        }
        return l;
      });
      await updateDoc(eventRef, { lotes: updatedLotes });
    }
  }

  return true;
};
