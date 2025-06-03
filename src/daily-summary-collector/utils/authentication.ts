import axios, { AxiosError } from 'axios';
import { Users } from '../models';

interface SerializedUser {
  id: number;
  encodedId?: string;
  access_token?: string;
  access_token_expires?: Date;
  refresh_token?: string;
}

const isTokenExpired = (tokenExpirationDate: any) => {
  if (!tokenExpirationDate) {
    return true;
  }

  const now = new Date();
  return tokenExpirationDate < now;
};

export async function getEligibleUsers(userModel: typeof Users) {
  try {
    const queryResult = await userModel.findAll({
      where: {
        role: 'senior',
        status: 'active',
        // access_token: {
        //   [Op.not]: undefined,
        // },
        // refresh_token: {
        //   [Op.not]: undefined,
        // },
      },
      attributes: [
        'id',
        'encodedId',
        'access_token',
        'access_token_expires',
        'refresh_token',
      ],
    });

    const users = queryResult
      .map(user => user.toJSON() as SerializedUser)
      .filter(user => user.refresh_token);

    return {
      count: users.length,
      users,
    };
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return {
      count: 0,
      users: [],
    };
  }
}

export async function getAccessToken(user: SerializedUser) {
  let accessToken: string | undefined;

  const {
    id: userId,
    encodedId: fitbit_user_id,
    access_token,
    access_token_expires,
    refresh_token,
  } = user;

  if (!access_token || isTokenExpired(access_token_expires)) {
    console.log(
      `유저 ${fitbit_user_id} 의 액세스 토큰이 존재하지 않거나 만료 상태입니다. 새 토큰을 요청합니다:`,
    );
    if (refresh_token) {
      try {
        const { data: oauthRefreshResponse } = await axios.post(
          'https://dayinbloom.shop/auth/refresh',
          {
            fitbit_user_id,
            refresh_token: refresh_token,
          },
        );
        accessToken = oauthRefreshResponse.accessToken;
        console.log(
          `유저 ${fitbit_user_id} 의 새 액세스 토큰을 발급받았습니다: ${accessToken}`,
        );
      } catch (error) {
        if (error instanceof AxiosError) {
          console.error(
            `유저 ${fitbit_user_id} 의 새 액세스 토큰을 발급받는 과정에서 오류가 발생했습니다:`,
          );
          console.error(JSON.stringify(error.response?.data));
        }
      }
    } else {
      console.error(
        `유저 ${fitbit_user_id} 의 리프레시 토큰이 존재하지 않아 데이터 수집이 불가능한 상황입니다. 앱 로그인 기록이 존재해야 합니다.`,
      );
    }
  } else {
    console.log(
      `유저 ${fitbit_user_id} 의 액세스 토큰이 존재하며, 만료 전입니다.`,
    );
    accessToken = access_token;
  }

  return { userId, accessToken };
}
