import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiError } from '../dto/api-response';
import { ErrorCode } from '../errors/error-codes';
import { AppException } from '../exceptions/app.exception';
import { AllExceptionsFilter } from './all-exceptions.filter';

function mockHost(): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock<void, [ApiError]>;
} {
  const json = jest.fn<void, [ApiError]>();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', url: '/api/v1/test' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('AppException → status + code + message', () => {
    const { host, status, json } = mockHost();
    filter.catch(
      AppException.conflict(ErrorCode.EMAIL_TAKEN, 'Email band'),
      host,
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const body = json.mock.calls[0][0];
    expect(body).toEqual({
      success: false,
      error: { code: 'EMAIL_TAKEN', message: 'Email band', details: undefined },
    });
  });

  it('Nest HttpException (404) → NOT_FOUND code', () => {
    const { host, status, json } = mockHost();
    filter.catch(new NotFoundException('Yo`q'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
    expect(body.error.message).toBe('Yo`q');
  });

  it('ValidationPipe massiv message → details`ga ko`chadi', () => {
    const { host, json } = mockHost();
    // ValidationPipe xatosini simulyatsiya (message: string[])
    filter.catch(
      new BadRequestException(['email noto`g`ri', 'parol qisqa']),
      host,
    );
    const body = json.mock.calls[0][0];
    expect(body.error.message).toBe('Validatsiya xatosi');
    expect(body.error.details).toEqual(['email noto`g`ri', 'parol qisqa']);
  });

  it('Prisma P2002 → 409 CONFLICT', () => {
    const { host, status, json } = mockHost();
    const prismaErr = new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: '6',
      meta: { target: ['email'] },
    });
    filter.catch(prismaErr, host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe(ErrorCode.CONFLICT);
  });

  it('noma`lum xato → 500 INTERNAL_ERROR', () => {
    const { host, status, json } = mockHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = json.mock.calls[0][0];
    expect(body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
  });
});
