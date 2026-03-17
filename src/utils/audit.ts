import { ref, push, serverTimestamp } from 'firebase/database';
import { rtdb } from '../config/firebaseConfig';

export const logAction = async (usuario: string, acao: string, modulo: string, pagina: string = 'N/A') => {
  try {
    const logsRef = ref(rtdb, 'logs_acesso');
    await push(logsRef, {
      usuario,
      acao,
      modulo,
      pagina,
      horario: serverTimestamp(),
    });

    const viewsRef = ref(rtdb, 'ultimas_visualizacoes');
    await push(viewsRef, {
      usuario,
      pagina,
      horario: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};
