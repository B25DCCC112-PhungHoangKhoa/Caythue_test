import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Database } from './config/db.js';
import { User } from './models/User.js';
import { Game } from './models/Game.js';
import { RankTier } from './models/RankTier.js';
import { Service, DEFAULT_CUSTOM_OPTIONS } from './models/Service.js';
import { Order } from './models/Order.js';
import { Review } from './models/Review.js';

dotenv.config();

export class DatabaseSeeder {
  public static async run(): Promise<void> {
    try {
      console.log('[Seed] Connecting to MongoDB...');
      await Database.connect();

      console.log('[Seed] Clearing existing collections...');
      await Promise.all([
        User.deleteMany({}),
        Game.deleteMany({}),
        RankTier.deleteMany({}),
        Service.deleteMany({}),
        Order.deleteMany({}),
        Review.deleteMany({})
      ]);

      console.log('[Seed] Seeding Users (Admin & Client)...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('123456', salt);

      const [admin, client] = await Promise.all([
        User.create({
          name: 'Administrator',
          email: 'admin@gmail.com',
          password: passwordHash,
          role: 'admin',
          phoneNumber: '0901234567'
        }),
        User.create({
          name: 'Nguyễn Văn Khách',
          email: 'client@gmail.com',
          password: passwordHash,
          role: 'client',
          phoneNumber: '0987654321'
        })
      ]);

      console.log(`[Seed] Created Admin: ${admin.email}, Client: ${client.email}`);

      // ========================================================
      // 1. SEED 6 CORE ESPORTS GAMES (Focused & Clean)
      // ========================================================
      console.log('[Seed] Seeding 6 core competitive games...');
      const gamesData = [
        {
          name: 'Liên Quân Mobile',
          slug: 'lien-quan-mobile',
          thumbnail: 'https://caythue24.com/cdn/shop/files/Arena_of_Valor_200x.png',
          description: 'Dịch vụ cày thuê Liên Quân Mobile uy tín, cày sao Thách Đấu, bao winrate cao.',
          isActive: true
        },
        {
          name: 'Liên Minh Huyền Thoại',
          slug: 'lmht',
          thumbnail: 'https://caythue24.com/cdn/shop/files/League_200x.png',
          description: 'Cày rank Liên Minh Huyền Thoại (LOL), bảo mật tuyệt đối, hoàn thành đúng hẹn.',
          isActive: true
        },
        {
          name: 'Đấu Trường Chân Lý',
          slug: 'dtcl',
          thumbnail: 'https://caythue24.com/cdn/shop/files/TFT_495ee0a9-caf2-4ffa-8b1d-28efe9c52f6f_200x.png',
          description: 'Cày thuê ĐTCL (TFT) mùa mới, leo top Thách Đấu với đội ngũ Grandmaster.',
          isActive: true
        },
        {
          name: 'Valorant',
          slug: 'valorant',
          thumbnail: 'https://caythue24.com/cdn/shop/files/valorant_6c678ad6-88f1-42f8-bc02-f3994a3c6e3e_200x.png',
          description: 'Cày rank Valorant thần tốc, bảo mật phần cứng HWID, cam kết winrate cao.',
          isActive: true
        },
        {
          name: 'Counter-Strike 2',
          slug: 'cs2',
          thumbnail: 'https://caythue24.com/cdn/shop/files/CS2_7a409871-9e8e-458d-9e8a-ce20a5925379_200x.png',
          description: 'Dịch vụ cày rank Competitive CS2, nâng bậc kỹ năng từ các game thủ hàng đầu.',
          isActive: true
        },
        {
          name: 'Tốc Chiến',
          slug: 'toc-chien',
          thumbnail: 'https://caythue24.com/cdn/shop/files/Wild_Rift_200x.png',
          description: 'Dịch vụ leo rank Liên Minh: Tốc Chiến máy chủ Việt Nam và SEA.',
          isActive: true
        }
      ];

      const createdGames = await Game.insertMany(gamesData);
      const gameMap = new Map(createdGames.map((g) => [g.slug, g]));

      // ========================================================
      // 2. SEED AUTHENTIC RANK TIERS FOR 6 GAMES
      // ========================================================
      console.log('[Seed] Seeding rank tiers for each game...');

      // Liên Quân (9 ranks)
      const lqTiers = [
        { name: 'Đồng Đoàn', costToNext: 30000 },
        { name: 'Bạc Đoàn', costToNext: 40000 },
        { name: 'Vàng Đoàn', costToNext: 50000 },
        { name: 'Bạch Kim', costToNext: 60000 },
        { name: 'Kim Cương', costToNext: 80000 },
        { name: 'Tinh Anh', costToNext: 110000 },
        { name: 'Cao Thủ', costToNext: 150000 },
        { name: 'Chiến Tướng', costToNext: 220000 },
        { name: 'Thách Đấu', costToNext: 350000 }
      ];

      // LMHT & ĐTCL & Tốc Chiến (10 ranks)
      const mobaTiers = [
        { name: 'Sắt Đoàn', costToNext: 30000 },
        { name: 'Đồng Đoàn', costToNext: 40000 },
        { name: 'Bạc Đoàn', costToNext: 50000 },
        { name: 'Vàng Đoàn', costToNext: 60000 },
        { name: 'Bạch Kim', costToNext: 80000 },
        { name: 'Ngọc Lục Bảo', costToNext: 100000 },
        { name: 'Kim Cương', costToNext: 140000 },
        { name: 'Cao Thủ', costToNext: 190000 },
        { name: 'Đại Cao Thủ', costToNext: 260000 },
        { name: 'Thách Đấu', costToNext: 380000 }
      ];

      // Valorant (9 ranks)
      const valorantTiers = [
        { name: 'Iron (Sắt)', costToNext: 35000 },
        { name: 'Bronze (Đồng)', costToNext: 45000 },
        { name: 'Silver (Bạc)', costToNext: 55000 },
        { name: 'Gold (Vàng)', costToNext: 75000 },
        { name: 'Platinum (Bạch Kim)', costToNext: 95000 },
        { name: 'Diamond (Kim Cương)', costToNext: 130000 },
        { name: 'Ascendant (Xuất Sắc)', costToNext: 170000 },
        { name: 'Immortal (Bất Tử)', costToNext: 240000 },
        { name: 'Radiant (Rạng Rỡ)', costToNext: 380000 }
      ];

      // CS2 (7 ranks)
      const cs2Tiers = [
        { name: 'Silver I - Elite', costToNext: 40000 },
        { name: 'Gold Nova I - IV', costToNext: 60000 },
        { name: 'Master Guardian I - Elite', costToNext: 90000 },
        { name: 'Distinguished Master Guardian', costToNext: 130000 },
        { name: 'Legendary Eagle', costToNext: 180000 },
        { name: 'Supreme Master First Class', costToNext: 250000 },
        { name: 'The Global Elite', costToNext: 350000 }
      ];

      const allRankTiersToInsert: Array<{
        gameId: unknown;
        name: string;
        index: number;
        costToNext: number;
      }> = [];

      // Insert for Liên Quân
      const lq = gameMap.get('lien-quan-mobile')!;
      lqTiers.forEach((t, i) => {
        allRankTiersToInsert.push({ gameId: lq._id, name: t.name, index: i, costToNext: t.costToNext });
      });

      // Insert for LMHT, ĐTCL, Tốc Chiến
      for (const slug of ['lmht', 'dtcl', 'toc-chien']) {
        const g = gameMap.get(slug)!;
        mobaTiers.forEach((t, i) => {
          allRankTiersToInsert.push({ gameId: g._id, name: t.name, index: i, costToNext: t.costToNext });
        });
      }

      // Insert for Valorant
      const val = gameMap.get('valorant')!;
      valorantTiers.forEach((t, i) => {
        allRankTiersToInsert.push({ gameId: val._id, name: t.name, index: i, costToNext: t.costToNext });
      });

      // Insert for CS2
      const cs = gameMap.get('cs2')!;
      cs2Tiers.forEach((t, i) => {
        allRankTiersToInsert.push({ gameId: cs._id, name: t.name, index: i, costToNext: t.costToNext });
      });

      await RankTier.insertMany(allRankTiersToInsert);
      console.log(`[Seed] Inserted ${allRankTiersToInsert.length} rank tiers across 6 games.`);

      // ========================================================
      // 3. SEED 6 FOCUSED RANK BOOSTING SERVICES (1 PER GAME)
      // ========================================================
      console.log('[Seed] Seeding 6 primary Rank Boosting services...');

      const servicesToCreate = [
        {
          gameSlug: 'lien-quan-mobile',
          name: 'Cày Thuê Rank Liên Quân Mobile',
          description: 'Cày rank uy tín từ Đồng lên Thách Đấu, cam kết tỉ lệ thắng 90%+ và bảo mật tài khoản.',
          thumbnail: 'https://cdn.shopify.com/s/files/1/0250/9003/1694/files/rankboost_038642cb-5ae7-455a-a5e6-7d34554ade00.png?v=1698502389',
          serviceType: 'RANK_TIER' as const,
        },
        {
          gameSlug: 'lmht',
          name: 'Cày Thuê Xếp Hạng LMHT',
          description: 'Cày ELO leo rank Liên Minh Huyền Thoại nhanh chóng, bảo mật mạng riêng ảo VPN sạch.',
          thumbnail: 'https://cdn.shopify.com/s/files/1/0250/9003/1694/products/winrate.png?v=1624085657',
          serviceType: 'RANK_TIER' as const,
        },
        {
          gameSlug: 'dtcl',
          name: 'Cày Rank Đấu Trường Chân Lý (TFT)',
          description: 'Cày thuê TFT mùa giải mới, tối ưu hóa đội hình meta cam kết trung bình Top 1 - 3.',
          thumbnail: 'https://caythue24.com/cdn/shop/files/2_7c7b3a91-67c3-4f79-9263-943abd6f0e45_400x.png',
          serviceType: 'RANK_TIER' as const,
        },
        {
          gameSlug: 'valorant',
          name: 'Cày Thuê Rank Valorant',
          description: 'Leo rank Valorant thần tốc từ Iron lên Radiant, cam kết bảo mật phần cứng tuyệt đối.',
          thumbnail: 'https://cdn.shopify.com/s/files/1/0250/9003/1694/products/valorantrankboost.png?v=1596695531',
          serviceType: 'RANK_TIER' as const,
        },
        {
          gameSlug: 'cs2',
          name: 'Cày Rank CS2 (Competitive)',
          description: 'Cày rank thi đấu cạnh tranh các bản đồ Mirage, Inferno, Dust 2 đạt mốc Global Elite.',
          thumbnail: 'https://cdn.shopify.com/s/files/1/0250/9003/1694/products/csgo_rankboost.png?v=1585580805',
          serviceType: 'RANK_TIER' as const,
        },
        {
          gameSlug: 'toc-chien',
          name: 'Cày Thuê Rank Tốc Chiến',
          description: 'Dịch vụ leo rank Tốc Chiến chuyên nghiệp từ Sắt lên Thách Đấu máy chủ VN / SEA.',
          thumbnail: 'https://cdn.shopify.com/s/files/1/0250/9003/1694/products/rankboost.png?v=1604463842',
          serviceType: 'RANK_TIER' as const,
        }
      ];

      for (const item of servicesToCreate) {
        const game = gameMap.get(item.gameSlug);
        if (game) {
          await Service.create({
            gameId: game._id,
            name: item.name,
            description: item.description,
            thumbnail: item.thumbnail,
            customOptions: DEFAULT_CUSTOM_OPTIONS,
            isActive: true
          });
        }
      }

      console.log(`[Seed] Seeded ${servicesToCreate.length} standardized rank boosting services.`);

      // ========================================================
      // 4. SEED SAMPLE REALISTIC ORDERS & REVIEWS
      // ========================================================
      const allServices = await Service.find({}).populate('gameId');
      const lqService = allServices.find((s) => (s.gameId as unknown as { slug: string }).slug === 'lien-quan-mobile')!;
      const lmhtService = allServices.find((s) => (s.gameId as unknown as { slug: string }).slug === 'lmht')!;
      const valService = allServices.find((s) => (s.gameId as unknown as { slug: string }).slug === 'valorant')!;

      const lqTiersList = await RankTier.find({ gameId: lqService.gameId }).sort({ index: 1 });
      const lmhtTiersList = await RankTier.find({ gameId: lmhtService.gameId }).sort({ index: 1 });
      const valTiersList = await RankTier.find({ gameId: valService.gameId }).sort({ index: 1 });

      const [order1, order2, order3] = await Promise.all([
        // Đơn 1: Hoàn thành - Liên Quân Vàng lên Kim Cương
        Order.create({
          orderCode: 'CT24-001',
          transferCode: 'ORDER001',
          userId: client._id,
          serviceId: lqService._id,
          startRankTierId: lqTiersList[2]._id, // Vàng
          targetRankTierId: lqTiersList[4]._id, // Kim Cương
          customOptions: [{ key: 'express', name: 'Cày siêu tốc (Express)', percentage: 35 }],
          accountInfo: {
            inGameAccount: 'garena_pro99',
            inGamePassword: '******',
            inGameServer: 'Garena VN',
            contactPhone: '',
            note: 'Cày ngoài giờ làm việc (sau 18h tối)'
          },
          basePrice: 110000,
          totalPrice: 148500,
          paymentMethod: 'VIETQR',
          paymentStatus: 'paid',
          orderStatus: 'completed'
        }),

        // Đơn 2: Đang xử lý - LMHT Bạch Kim lên Lục Bảo
        Order.create({
          orderCode: 'CT24-002',
          transferCode: 'ORDER002',
          userId: client._id,
          serviceId: lmhtService._id,
          startRankTierId: lmhtTiersList[4]._id, // Bạch Kim
          targetRankTierId: lmhtTiersList[5]._id, // Lục Bảo
          customOptions: [{ key: 'pick_hero', name: 'Chỉ định tướng tủ', percentage: 25 }],
          accountInfo: {
            inGameAccount: 'riot_gamer',
            inGamePassword: '******',
            inGameServer: 'VNG Riot',
            contactPhone: '',
            note: 'Chỉ định tướng Yasuo, Yone đi mid'
          },
          basePrice: 80000,
          totalPrice: 100000,
          paymentMethod: 'VIETQR',
          paymentStatus: 'paid',
          orderStatus: 'in_progress'
        }),

        // Đơn 3: Đang chờ duyệt - Valorant Gold lên Diamond
        Order.create({
          orderCode: 'CT24-003',
          transferCode: 'ORDER003',
          userId: client._id,
          serviceId: valService._id,
          startRankTierId: valTiersList[3]._id, // Gold
          targetRankTierId: valTiersList[5]._id, // Diamond
          customOptions: [{ key: 'express', name: 'Cày siêu tốc (Express)', percentage: 35 }],
          accountInfo: {
            inGameAccount: 'val_player_vn',
            inGamePassword: '******',
            inGameServer: 'Asia Pacific',
            contactPhone: '',
            note: 'Ưu tiên cày ban đêm'
          },
          basePrice: 170000,
          totalPrice: 229500,
          paymentMethod: 'VIETQR',
          paymentStatus: 'paid',
          orderStatus: 'pending'
        })
      ]);

      // Seed Reviews
      await Review.create({
        userId: client._id,
        serviceId: lqService._id,
        orderId: order1._id,
        rating: 5,
        comment: 'Cày siêu nhanh, từ Vàng lên Kim Cương trong đúng 1 buổi tối. K/D cao ngất ngưởng!'
      });

      await Review.create({
        userId: client._id,
        serviceId: lmhtService._id,
        orderId: order2._id,
        rating: 5,
        comment: 'Dịch vụ uy tín, bảo mật an toàn có VPN, hỗ trợ nhiệt tình qua Zalo. Rất hài lòng.'
      });

      console.log('[Seed] Seeded realistic sample orders and reviews.');
      console.log('[Seed] Database successfully seeded with clean, standardized Rank Boosting data!');

      await Database.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('[Seed Error] Failed to seed database:', error);
      await Database.disconnect();
      process.exit(1);
    }
  }
}

DatabaseSeeder.run();
