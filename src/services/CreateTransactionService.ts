import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    if (!['income', 'outcome'].includes(type))
      throw new AppError('Type not allow.');

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();
    if (type === 'outcome' && value > total)
      throw new AppError('Transaction not allow.');

    let categoryResult = await categoriesRepository.findOne({
      where: { title: category },
    });

    if (!categoryResult) {
      categoryResult = categoriesRepository.create({ title: category });

      await categoriesRepository.save(categoryResult);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryResult.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
